// Project Context Middleware for Multi-Tenancy Resolution
import { NextFunction, Request, Response } from 'express';
import { projectService } from '../project/services/project.service';
import { ProjectNotFoundError } from '../errors/project.errors';
import { Project } from '../project/entities/project.entity';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      project?: Project;
      projectId?: string;
    }
  }
}

export const projectContextMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slugOrId =
      req.params.project_slug ||
      req.params.projectId ||
      (req.headers['x-project-slug'] as string) ||
      (req.headers['x-project-id'] as string);

    if (!slugOrId) {
      throw new ProjectNotFoundError('Project context parameter missing in request');
    }

    const project = await projectService.resolveProject(slugOrId);
    req.project = project;
    req.projectId = project.id;

    next();
  } catch (err) {
    next(err);
  }
};
