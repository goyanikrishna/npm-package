// Dynamic Field Validator for User Profiles
import { configManager } from '../../config/config.manager';
import { IUserFieldConfig } from '../../config/types';
import { DynamicFieldValidationError } from '../../errors/config.errors';

export const validateDynamicFields = (
  data: Record<string, unknown> = {},
  fieldsConfig?: IUserFieldConfig[],
  isPartial: boolean = false,
): Record<string, unknown> => {
  const configuredFields = fieldsConfig || configManager.getUsers().fields || [];
  const errors: Record<string, string> = {};
  const sanitized: Record<string, unknown> = {};

  for (const field of configuredFields) {
    const value = data[field.name];

    if (isPartial && value === undefined) {
      continue;
    }

    // Check required
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.name] = `Field "${field.name}" is required`;
      continue;
    }

    if (value === undefined || value === null) {
      if (field.nullable !== false) {
        sanitized[field.name] = null;
      }
      continue;
    }

    // Type validation
    switch (field.type) {
      case 'string':
      case 'text': {
        if (typeof value !== 'string') {
          errors[field.name] = `Field "${field.name}" must be a string`;
        } else if (field.maxLength && value.length > field.maxLength) {
          errors[field.name] = `Field "${field.name}" exceeds maximum length of ${field.maxLength}`;
        } else {
          sanitized[field.name] = value;
        }
        break;
      }
      case 'integer': {
        const num = Number(value);
        if (!Number.isInteger(num)) {
          errors[field.name] = `Field "${field.name}" must be an integer`;
        } else {
          sanitized[field.name] = num;
        }
        break;
      }
      case 'decimal': {
        const dec = Number(value);
        if (isNaN(dec)) {
          errors[field.name] = `Field "${field.name}" must be a valid number`;
        } else {
          sanitized[field.name] = dec;
        }
        break;
      }
      case 'boolean': {
        if (typeof value === 'boolean') {
          sanitized[field.name] = value;
        } else if (value === 'true' || value === 1) {
          sanitized[field.name] = true;
        } else if (value === 'false' || value === 0) {
          sanitized[field.name] = false;
        } else {
          errors[field.name] = `Field "${field.name}" must be a boolean`;
        }
        break;
      }
      case 'date':
      case 'datetime': {
        const date = new Date(value as string | number);
        if (isNaN(date.getTime())) {
          errors[field.name] = `Field "${field.name}" must be a valid date`;
        } else {
          sanitized[field.name] = date;
        }
        break;
      }
      case 'uuid': {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
          errors[field.name] = `Field "${field.name}" must be a valid UUID`;
        } else {
          sanitized[field.name] = value;
        }
        break;
      }
      case 'enum': {
        const validValues = field.enumValues || [];
        if (!validValues.includes(String(value))) {
          errors[field.name] = `Field "${field.name}" must be one of: ${validValues.join(', ')}`;
        } else {
          sanitized[field.name] = value;
        }
        break;
      }
      default:
        sanitized[field.name] = value;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new DynamicFieldValidationError('Dynamic field validation failed', errors);
  }

  return sanitized;
};
