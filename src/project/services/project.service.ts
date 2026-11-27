// Project Service for node-backend-toolkit
import { getDataSource } from '../../database/datasource';
import { DuplicateProjectError, ProjectNotFoundError } from '../../errors/project.errors';
import {
  formatPaginatedResponse,
  IPaginatedResult,
  IPaginationQuery,
  parsePagination,
} from '../../utils/pagination.util';
import { slugify } from '../../utils/slug.util';
import { Project } from '../entities/project.entity';
import { ICreateProjectDto, IUpdateProjectDto } from '../types';
import { Repository } from 'typeorm';

export { ICreateProjectDto, IUpdateProjectDto };

const getProjectRepo = (): Repository<Project> => {
  return getDataSource().getRepository(Project);
};

const createProject = async (dto: ICreateProjectDto): Promise<Project> => {
  const repo = getProjectRepo();
  const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);

  // Check for duplicate name or slug
  const existing = await repo.findOne({
    where: [{ name: dto.name }, { slug }],
  });

  if (existing) {
    throw new DuplicateProjectError(
      `Project with name "${dto.name}" or slug "${slug}" already exists`,
    );
  }

  const project = repo.create({
    name: dto.name,
    slug,
    description: dto.description || null,
    status: dto.status || 'active',
  });

  return repo.save(project);
};

const getProjectById = async (id: string): Promise<Project> => {
  const repo = getProjectRepo();
  const project = await repo.findOne({ where: { id } });
  if (!project) {
    throw new ProjectNotFoundError(`Project with ID "${id}" not found`);
  }
  return project;
};

const getProjectBySlug = async (slug: string): Promise<Project> => {
  const repo = getProjectRepo();
  const project = await repo.findOne({ where: { slug } });
  if (!project) {
    throw new ProjectNotFoundError(`Project with slug "${slug}" not found`);
  }
  return project;
};

const resolveProject = async (slugOrId: string): Promise<Project> => {
  const repo = getProjectRepo();
  // Check if valid UUID format
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  if (isUuid) {
    const project = await repo.findOne({ where: { id: slugOrId } });
    if (project) return project;
  }

  const project = await repo.findOne({ where: { slug: slugOrId } });
  if (!project) {
    throw new ProjectNotFoundError(`Project "${slugOrId}" not found`);
  }
  return project;
};

const updateProject = async (id: string, dto: IUpdateProjectDto): Promise<Project> => {
  const repo = getProjectRepo();
  const project = await getProjectById(id);

  if (dto.name && dto.name !== project.name) {
    const existing = await repo.findOne({ where: { name: dto.name } });
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

  return repo.save(project);
};

const listProjects = async (query?: IPaginationQuery): Promise<IPaginatedResult<Project>> => {
  const repo = getProjectRepo();
  const { page, limit, skip } = parsePagination(query);

  const [items, total] = await repo.findAndCount({
    skip,
    take: limit,
    order: { created_at: 'DESC' },
  });

  return formatPaginatedResponse(items, total, page, limit);
};

const deleteProject = async (id: string): Promise<void> => {
  const repo = getProjectRepo();
  const project = await getProjectById(id);
  await repo.remove(project);
};

export const projectService = {
  createProject,
  getProjectById,
  getProjectBySlug,
  resolveProject,
  updateProject,
  listProjects,
  deleteProject,
};
