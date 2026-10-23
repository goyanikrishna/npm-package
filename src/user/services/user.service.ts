// User Service for node-backend-toolkit
import { IsNull, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { getDataSource } from '../../database/datasource';
import { configManager } from '../../config/config.manager';
import {
  DuplicateEmailError,
  SelfDemotionError,
  SuperAdminProtectedError,
  UserNotFoundError,
} from '../../errors/user.errors';
import { normalizeEmail } from '../../utils/email-normalizer.util';
import {
  parsePagination,
  formatPaginatedResponse,
  IPaginationQuery,
  IPaginatedResult,
} from '../../utils/pagination.util';
import { validateDynamicFields } from '../validators/dynamic-field.validator';
import { passwordService } from '../../auth/services/password.service';

export interface ICreateUserDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  status?: string;
  language?: string;
  avatar?: string;
  profile?: Record<string, unknown>;
}

export interface IUpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  status?: string;
  language?: string;
  avatar?: string;
  profile?: Record<string, unknown>;
}

export interface IUserFilterQuery extends IPaginationQuery {
  search?: string;
  role?: string;
  status?: string;
}

export class UserService {
  private get userRepo(): Repository<User> {
    return getDataSource().getRepository(User);
  }

  public sanitizeUser(user: User): Partial<User> {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  public async createUser(
    projectId: string,
    dto: ICreateUserDto,
    creatorId?: string,
  ): Promise<Partial<User>> {
    const email = normalizeEmail(dto.email);

    // Check duplicate active email within project
    const existing = await this.userRepo.findOne({
      where: { project_id: projectId, email, deleted_at: IsNull() },
    });

    if (existing) {
      throw new DuplicateEmailError(`User with email "${email}" already exists in this project`);
    }

    const authConfig = configManager.getAuth();
    const role = dto.role || authConfig.registration?.defaultRole || 'user';
    const status = dto.status || authConfig.registration?.defaultStatus || 'active';

    let rawPassword = dto.password;
    if (rawPassword) {
      passwordService.validatePolicy(rawPassword);
    } else {
      rawPassword = Math.random().toString(36).slice(-10) + 'A1!';
    }

    const sanitizedProfile = validateDynamicFields(dto.profile || {});

    const ds = getDataSource();
    return ds.transaction(async (manager) => {
      const user = manager.create(User, {
        project_id: projectId,
        first_name: dto.firstName,
        last_name: dto.lastName,
        phone: dto.phone || null,
        email,
        password: rawPassword,
        role,
        status,
        language: dto.language || 'en',
        avatar: dto.avatar || null,
        created_by: creatorId || null,
      });

      const savedUser = await manager.save(user);

      const profile = manager.create(UserProfile, {
        user_id: savedUser.id,
        project_id: projectId,
        ...sanitizedProfile,
      });

      await manager.save(profile);
      savedUser.profile = profile;

      return this.sanitizeUser(savedUser);
    });
  }

  public async getUserById(id: string, projectId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, project_id: projectId, deleted_at: IsNull() },
      relations: ['profile'],
    });

    if (!user) {
      throw new UserNotFoundError(`User with ID "${id}" not found`);
    }

    return user;
  }

  public async getUserByEmail(
    projectId: string,
    email: string,
    includePassword: boolean = false,
  ): Promise<User | null> {
    const normalized = normalizeEmail(email);
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.project_id = :projectId', { projectId })
      .andWhere('user.email = :email', { email: normalized })
      .andWhere('user.deleted_at IS NULL');

    if (includePassword) {
      query.addSelect('user.password');
    }

    return query.getOne();
  }

  public async listUsers(
    projectId: string,
    query?: IUserFilterQuery,
  ): Promise<IPaginatedResult<Partial<User>>> {
    const { page, limit, skip } = parsePagination(query);
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.project_id = :projectId', { projectId })
      .andWhere('user.deleted_at IS NULL');

    if (query?.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query?.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    if (query?.search) {
      const search = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search },
      );
    }

    qb.orderBy('user.created_at', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();
    const safeUsers = users.map((u) => this.sanitizeUser(u));

    return formatPaginatedResponse(safeUsers, total, page, limit);
  }

  public async updateUser(
    id: string,
    projectId: string,
    dto: IUpdateUserDto,
    updaterId?: string,
    callerRole?: string,
  ): Promise<Partial<User>> {
    const user = await this.getUserById(id, projectId);

    // Safeguard D03: Super Admin cannot self-demote
    if (
      user.id === updaterId &&
      user.role === 'super_admin' &&
      dto.role &&
      dto.role !== 'super_admin'
    ) {
      throw new SelfDemotionError();
    }

    // Safeguard D02: Non-SuperAdmin cannot modify a Super Admin account
    if (user.role === 'super_admin' && callerRole !== 'super_admin' && user.id !== updaterId) {
      throw new SuperAdminProtectedError();
    }

    if (dto.firstName) user.first_name = dto.firstName;
    if (dto.lastName) user.last_name = dto.lastName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;
    if (dto.language) user.language = dto.language;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (updaterId) user.updated_by = updaterId;

    const ds = getDataSource();
    return ds.transaction(async (manager) => {
      const savedUser = await manager.save(user);

      if (dto.profile) {
        const sanitizedProfile = validateDynamicFields(dto.profile);
        let profile = await manager.findOne(UserProfile, { where: { user_id: id } });
        if (!profile) {
          profile = manager.create(UserProfile, {
            user_id: id,
            project_id: projectId,
            ...sanitizedProfile,
          });
        } else {
          Object.assign(profile, sanitizedProfile);
        }
        await manager.save(profile);
        savedUser.profile = profile;
      }

      return this.sanitizeUser(savedUser);
    });
  }

  public async deleteUser(id: string, projectId: string, deleterId?: string): Promise<void> {
    const user = await this.getUserById(id, projectId);

    // Safeguard D02: Cannot delete a Super Admin
    if (user.role === 'super_admin') {
      throw new SuperAdminProtectedError('Super Admin accounts cannot be deleted');
    }

    user.deleted_at = new Date();
    user.deleted_by = deleterId || null;
    await this.userRepo.save(user);
  }

  public async getProfile(userId: string, projectId: string): Promise<Partial<User>> {
    const user = await this.getUserById(userId, projectId);
    return this.sanitizeUser(user);
  }

  public async updateProfile(
    userId: string,
    projectId: string,
    dto: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
      language?: string;
      profile?: Record<string, unknown>;
    },
  ): Promise<Partial<User>> {
    return this.updateUser(userId, projectId, dto, userId);
  }
}

export const userService = new UserService();
