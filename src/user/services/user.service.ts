// User Service for node-backend-toolkit
import { EntityManager, IsNull, Repository } from 'typeorm';
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
  IPaginatedResult,
} from '../../utils/pagination.util';
import { validateDynamicFields } from '../validators/dynamic-field.validator';
import { passwordService } from '../../auth/services/password.service';
import { sessionService } from '../../session/services/session.service';
import { ICreateUserDto, IUpdateUserDto, IUserFilterQuery } from '../types';

export { ICreateUserDto, IUpdateUserDto, IUserFilterQuery };

export class UserService {
  private get userRepo(): Repository<User> {
    return getDataSource().getRepository(User);
  }

  public sanitizeUser(user: User): Partial<User> {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Helper to extract dynamic profile fields from root DTO and nested profile object,
   * then validate against the project schema.
   */
  private extractAndValidateProfile(
    dto: Record<string, unknown>,
    isPartial: boolean = false,
  ): Record<string, unknown> | null {
    const configuredFields = configManager.getUsers().fields || [];
    const dynamicPayload: Record<string, unknown> = {
      ...((dto.profile as Record<string, unknown>) || {}),
    };
    for (const f of configuredFields) {
      if (dto[f.name] !== undefined) {
        dynamicPayload[f.name] = dto[f.name];
      }
    }
    const hasUpdates = Object.keys(dynamicPayload).length > 0;
    if (isPartial && !hasUpdates) {
      return null;
    }
    return validateDynamicFields(dynamicPayload, configuredFields, isPartial);
  }

  /**
   * Helper to fetch and attach unmapped dynamic profile columns from raw user_profiles.
   */
  private async attachUserProfile(user: User, manager?: EntityManager): Promise<User> {
    try {
      const qb = manager || this.userRepo.manager;
      const profileRows = await qb.query(`SELECT * FROM "user_profiles" WHERE "user_id" = $1`, [
        user.id,
      ]);
      if (profileRows && profileRows.length > 0) {
        user.profile = profileRows[0];
      }
    } catch {
      // Fallback for mock/in-memory environments
    }
    return user;
  }

  public async createUser(
    project_id: string,
    dto: ICreateUserDto,
    creatorId?: string,
  ): Promise<Partial<User>> {
    const email = normalizeEmail(dto.email);

    // Check duplicate active email within project
    const existing = await this.userRepo.findOne({
      where: { project_id, email, deleted_at: IsNull() },
    });

    if (existing) {
      throw new DuplicateEmailError(`User with email "${email}" already exists in this project`);
    }

    const authConfig = configManager.getAuth();
    const role = dto.role || authConfig.registration?.defaultRole || 'user';
    const status = dto.status || authConfig.registration?.default_status || 'active';

    const rawPassword = dto.password || Math.random().toString(36).slice(-10) + 'A1!';
    const hashedPassword = await passwordService.validateAndHash(rawPassword);

    const sanitizedProfile = this.extractAndValidateProfile(dto, false) || {};

    const firstName = (dto.first_name || '').trim();
    const lastName = (dto.last_name || '').trim();

    const ds = getDataSource();
    return ds.transaction(async (manager) => {
      const user = manager.create(User, {
        project_id: project_id,
        first_name: firstName,
        last_name: lastName,
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
      const profileValues = [savedUser.id, project_id, ...Object.values(sanitizedProfile)];
      await manager.query(
        `INSERT INTO "user_profiles" (${quotedCols}) VALUES (${profilePlaceholders}) RETURNING *`,
        profileValues,
      );

      await this.attachUserProfile(savedUser, manager);
      return this.sanitizeUser(savedUser);
    });
  }

  public async getUserById(id: string, project_id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, project_id: project_id, deleted_at: IsNull() },
      relations: ['profile'],
    });

    if (!user) {
      throw new UserNotFoundError(`User with ID "${id}" not found`);
    }

    await this.attachUserProfile(user);
    return user;
  }

  public async getUserByEmail(
    project_id: string,
    email: string,
    includePassword: boolean = false,
  ): Promise<User | null> {
    const normalized = normalizeEmail(email);
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.project_id = :project_id', { project_id })
      .andWhere('user.email = :email', { email: normalized })
      .andWhere('user.deleted_at IS NULL');

    if (includePassword) {
      query.addSelect('user.password');
    }

    const user = await query.getOne();
    if (user) {
      await this.attachUserProfile(user);
    }

    return user;
  }

  public async listUsers(
    project_id: string,
    query?: IUserFilterQuery,
  ): Promise<IPaginatedResult<Partial<User>>> {
    const { page, limit, skip } = parsePagination(query);
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.project_id = :project_id', { project_id })
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
        "(LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR LOWER(CONCAT(user.first_name, ' ', user.last_name)) LIKE :search OR LOWER(user.email) LIKE :search)",
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
        // Fallback
      }
    }

    const safeUsers = users.map((u) => this.sanitizeUser(u));
    return formatPaginatedResponse(safeUsers, total, page, limit);
  }

  public async updateUser(
    id: string,
    project_id: string,
    dto: IUpdateUserDto,
    updaterId?: string,
    callerRole?: string,
  ): Promise<Partial<User>> {
    const user = await this.getUserById(id, project_id);

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

    // Safeguard D04: Non-SuperAdmin cannot promote anyone to Super Admin
    if (dto.role === 'super_admin' && callerRole !== 'super_admin') {
      throw new SuperAdminProtectedError('Only a Super Admin can promote a user to Super Admin');
    }

    if (dto.first_name !== undefined) user.first_name = dto.first_name;
    if (dto.last_name !== undefined) user.last_name = dto.last_name;

    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;
    if (dto.language) user.language = dto.language;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (updaterId) user.updated_by = updaterId;

    if (dto.password) {
      user.password = await passwordService.validateAndHash(dto.password);
    }

    const sanitizedProfile = this.extractAndValidateProfile(dto, true);

    const ds = getDataSource();
    return ds.transaction(async (manager) => {
      const savedUser = await manager.save(user);

      if (sanitizedProfile && Object.keys(sanitizedProfile).length > 0) {
        try {
          const keys = Object.keys(sanitizedProfile);
          const values = Object.values(sanitizedProfile);
          const quotedKeys = keys.map((k) => `"${k}"`).join(', ');
          const valPlaceholders = keys.map((_, i) => `$${i + 3}`).join(', ');
          const updateSets = keys.map((k, i) => `"${k}" = $${i + 3}`).join(', ');

          await manager.query(
            `INSERT INTO "user_profiles" ("user_id", "project_id", ${quotedKeys})
             VALUES ($1, $2, ${valPlaceholders})
             ON CONFLICT ("user_id")
             DO UPDATE SET ${updateSets}, "updated_at" = NOW()`,
            [id, project_id, ...values],
          );
        } catch {
          // Fallback to TypeORM save
          let profile = await manager.findOne(UserProfile, { where: { user_id: id } });
          if (!profile) {
            profile = manager.create(UserProfile, {
              user_id: id,
              project_id: project_id,
              ...sanitizedProfile,
            });
          } else {
            Object.assign(profile, sanitizedProfile);
          }
          await manager.save(profile);
        }
      }

      await this.attachUserProfile(savedUser, manager);
      return this.sanitizeUser(savedUser);
    });
  }

  public async deleteUser(id: string, project_id: string, deleterId?: string): Promise<void> {
    const user = await this.getUserById(id, project_id);

    // Safeguard D02: Cannot delete a Super Admin
    if (user.role === 'super_admin') {
      throw new SuperAdminProtectedError('Super Admin accounts cannot be deleted');
    }

    user.deleted_at = new Date();
    user.deleted_by = deleterId || null;
    await this.userRepo.save(user);

    // Revoke all active sessions for the deleted user (FB-05)
    await sessionService.revokeAllUserSessions(id);
  }

  public async getProfile(user_id: string, project_id: string): Promise<Partial<User>> {
    const user = await this.getUserById(user_id, project_id);
    return this.sanitizeUser(user);
  }

  public async updateProfile(
    user_id: string,
    project_id: string,
    dto: IUpdateUserDto,
  ): Promise<Partial<User>> {
    // Prevent mass-assignment / privilege escalation: users cannot modify role, status, email, or password via profile update (FB-01)
    const {
      role: _role,
      status: _status,
      email: _email,
      password: _password,
      ...safeProfileDto
    } = dto as Record<string, unknown>;

    return this.updateUser(user_id, project_id, safeProfileDto as IUpdateUserDto, user_id);
  }
}

export const userService = new UserService();
