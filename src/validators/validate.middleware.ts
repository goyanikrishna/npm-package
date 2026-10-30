// Validation Middleware using Joi schemas
import { NextFunction, Request, Response } from 'express';
import { Schema } from 'joi';
import { BadRequestException } from '../errors/base.error';
import { ErrMessages } from '../constants/app-message.constant';

export interface IValidationSchema {
  body?: Schema;
  params?: Schema;
  query?: Schema;
  headers?: Schema;
}

export const validate = (schema: IValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body && req.body) {
        const { error, value } = schema.body.validate(req.body, {
          abortEarly: false,
        });
        if (error) {
          throw new BadRequestException(
            ErrMessages.VALIDATION_FAILED,
            error.details.map((d) => d.message),
          );
        }
        req.body = value;
      }

      if (schema.params && req.params) {
        const { error, value } = schema.params.validate(req.params, {
          abortEarly: false,
          allowUnknown: true,
        });
        if (error) {
          throw new BadRequestException(
            ErrMessages.PARAMS_VALIDATION_FAILED,
            error.details.map((d) => d.message),
          );
        }
        req.params = value;
      }

      if (schema.query && req.query) {
        const { error, value } = schema.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (error) {
          throw new BadRequestException(
            ErrMessages.QUERY_VALIDATION_FAILED,
            error.details.map((d) => d.message),
          );
        }
        req.query = value;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
