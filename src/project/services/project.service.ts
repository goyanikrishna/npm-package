// Project Service for node-backend-toolkit
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { getDataSource } from '../../database/datasource';
import { DuplicateProjectError, ProjectNotFoundError } from '../../errors/project.errors';
import { slugify } from '../../utils/slug.util';
import {
  parsePagination,
  formatPaginatedResponse,
  IPaginationQuery,
  IPaginatedResult,
} from '../../utils/pagination.util';
import { ICreateProjectDto, IUpdateProjectDto } from '../types';

export { ICreateProjectDto, IUpdateProjectDto };

export class ProjectService {
  private get repo(): Repository<Project> {
    return getDataSource().getRepository(Project);
  }

  public async createProject(dto: ICreateProjectDto): Promise<Project> {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);

    // Check for duplicate name or slug
    const existing = await this.repo.findOne({
      where: [{ name: dto.name }, { slug }],
    });

    if (existing) {
      throw new DuplicateProjectError(
        `Project with name "${dto.name}" or slug "${slug}" already exists`,
      );
    }

    const project = this.repo.create({
      name: dto.name,
      slug,
      description: dto.description || null,
      status: dto.status || 'active',
    });

    return this.repo.save(project);
  }

  public async getProjectById(id: string): Promise<Project> {
    const project = await this.repo.findOne({ where: { id } });
    if (!project) {
      throw new ProjectNotFoundError(`Project with ID "${id}" not found`);
    }
    return project;
  }

  public async getProjectBySlug(slug: string): Promise<Project> {
    const project = await this.repo.findOne({ where: { slug } });
    if (!project) {
      throw new ProjectNotFoundError(`Project with slug "${slug}" not found`);
    }
    return project;
  }

  public async resolveProject(slugOrId: string): Promise<Project> {
    // Check if valid UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    if (isUuid) {
      const project = await this.repo.findOne({ where: { id: slugOrId } });
      if (project) return project;
    }

    const project = await this.repo.findOne({ where: { slug: slugOrId } });
    if (!project) {
      throw new ProjectNotFoundError(`Project "${slugOrId}" not found`);
    }
    return project;
  }

  public async updateProject(id: string, dto: IUpdateProjectDto): Promise<Project> {
    const project = await this.getProjectById(id);

    if (dto.name && dto.name !== project.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new DuplicateProjectError(`Project with name "${dto.name}" already exists`);
      }
      project.name = dto.name;
    }

    if (dto.description !== undefined) {
      project.description = dto.description;
    }

    if (dto.status !== undefined) {
      project.status = dto.status;
    }

    return this.repo.save(project);
  }

  public async listProjects(query?: IPaginationQuery): Promise<IPaginatedResult<Project>> {
    const { page, limit, skip } = parsePagination(query);

    const [items, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return formatPaginatedResponse(items, total, page, limit);
  }

  public async deleteProject(id: string): Promise<void> {
    const project = await this.getProjectById(id);
    await this.repo.remove(project);
  }
}

export const projectService = new ProjectService();
