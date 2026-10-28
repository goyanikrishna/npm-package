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
  [key: string]: unknown;
}

export interface IUpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  status?: string;
  language?: string;
  avatar?: string;
  password?: string;
  profile?: Record<string, unknown>;
  [key: string]: unknown;
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
    const hashedPassword = await passwordService.hashPassword(rawPassword);

    const configuredFields = configManager.getUsers().fields || [];
    const dynamicPayload: Record<string, unknown> = {
      ...(dto.profile || {}),
    };
    for (const f of configuredFields) {
      if (dto[f.name] !== undefined) {
        dynamicPayload[f.name] = dto[f.name];
      }
    }
    const sanitizedProfile = validateDynamicFields(dynamicPayload, configuredFields, false);

    const ds = getDataSource();
    return ds.transaction(async (manager) => {
      const user = manager.create(User, {
        project_id: projectId,
        first_name: dto.firstName,
        last_name: dto.lastName,
        phone: dto.phone || null,
        email,
        password: hashedPassword,
        role,
        status,
        language: dto.language || 'en',
        avatar: dto.avatar || null,
        created_by: creatorId || null,
      });

      const savedUser = await manager.save(user);

      const profileCols = ['user_id', 'project_id', ...Object.keys(sanitizedProfile)];
      const profilePlaceholders = profileCols.map((_, i) => `$${i + 1}`).join(', ');
      const quotedCols = profileCols.map((k) => `"${k}"`).join(', ');
      const profileValues = [savedUser.id, projectId, ...Object.values(sanitizedProfile)];
      const profileRows = await manager.query(
        `INSERT INTO "user_profiles" (${quotedCols}) VALUES (${profilePlaceholders}) RETURNING *`,
        profileValues,
      );
      savedUser.profile = profileRows[0] || (profileRows as any);

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

    try {
      const profileRows = await this.userRepo.manager.query(
        `SELECT * FROM "user_profiles" WHERE "user_id" = $1`,
        [user.id],
      );
      if (profileRows && profileRows.length > 0) {
        user.profile = profileRows[0];
      }
    } catch {
      // In-memory or fallback
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

    const user = await query.getOne();
    if (user) {
      try {
        const profileRows = await this.userRepo.manager.query(
          `SELECT * FROM "user_profiles" WHERE "user_id" = $1`,
          [user.id],
        );
        if (profileRows && profileRows.length > 0) {
          user.profile = profileRows[0];
        }
      } catch {
        // In-memory fallback
      }
    }

    return user;
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
      .andWhere('user.deleted_at IS NULL')
      .andWhere('user.role != :superAdminRole', { superAdminRole: 'super_admin' });

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

    if (users.length > 0) {
      try {
        const userIds = users.map((u) => u.id);
        const profileRows = await this.userRepo.manager.query(
          `SELECT * FROM "user_profiles" WHERE "user_id" = ANY($1)`,
          [userIds],
        );
        if (profileRows && profileRows.length > 0) {
          const profileMap = new Map(profileRows.map((p: any) => [p.user_id, p]));
          for (const u of users) {
            if (profileMap.has(u.id)) {
              u.profile = profileMap.get(u.id) as UserProfile;
            }
          }
        }
      } catch {
        // In-memory fallback
      }
    }

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

    if (dto.password) {
      passwordService.validatePolicy(dto.password);
      user.password = await passwordService.hashPassword(dto.password);
    }

    const configuredFields = configManager.getUsers().fields || [];
    const dynamicPayload: Record<string, unknown> = {
      ...(dto.profile || {}),
    };
    for (const f of configuredFields) {
      if (dto[f.name] !== undefined) {
        dynamicPayload[f.name] = dto[f.name];
      }
    }
    const hasDynamicUpdates = Object.keys(dynamicPayload).length > 0;
    const sanitizedProfile = hasDynamicUpdates
      ? validateDynamicFields(dynamicPayload, configuredFields, true)
      : null;

    const ds = getDataSource();
    return ds.transaction(async (manager) => {
      const savedUser = await manager.save(user);

      if (sanitizedProfile && Object.keys(sanitizedProfile).length > 0) {
        try {
          const keys = Object.keys(sanitizedProfile);
          const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
          const values = [...Object.values(sanitizedProfile), id];
          const updatedProfiles = await manager.query(
            `UPDATE "user_profiles" SET ${setClauses}, "updated_at" = NOW() WHERE "user_id" = $${keys.length + 1} RETURNING *`,
            values,
          );
          if (updatedProfiles && updatedProfiles.length > 0) {
            savedUser.profile = updatedProfiles[0];
          }
        } catch {
          // Fallback to TypeORM save
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
      } else {
        try {
          const profileRows = await manager.query(
            `SELECT * FROM "user_profiles" WHERE "user_id" = $1`,
            [id],
          );
          if (profileRows && profileRows.length > 0) {
            savedUser.profile = profileRows[0];
          }
        } catch {
          const existingProfile = await manager.findOne(UserProfile, { where: { user_id: id } });
          if (existingProfile) {
            savedUser.profile = existingProfile;
          }
        }
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
    dto: IUpdateUserDto,
  ): Promise<Partial<User>> {
    return this.updateUser(userId, projectId, dto, userId);
  }
}

export const userService = new UserService();
