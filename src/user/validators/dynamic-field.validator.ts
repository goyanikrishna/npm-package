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
    let val = data[field.name];

    if (isPartial && val === undefined) {
      continue;
    }

    if (val === undefined && !isPartial && field.default !== undefined) {
      val = field.default;
    }

    // Check required
    if (field.required && (val === undefined || val === null || val === '')) {
      errors[field.name] = `Field "${field.name}" is required`;
      continue;
    }

    if (val === undefined || val === null) {
      if (field.nullable !== false) {
        sanitized[field.name] = null;
      }
      continue;
    }

    // Type validation
    switch (field.type) {
      case 'string':
      case 'text': {
        if (typeof val !== 'string') {
          errors[field.name] = `Field "${field.name}" must be a string`;
        } else if (field.max_length && val.length > field.max_length) {
          errors[field.name] = `Field "${field.name}" exceeds maximum length of ${field.max_length}`;
        } else {
          sanitized[field.name] = val;
        }
        break;
      }
      case 'integer': {
        const num = Number(val);
        if (!Number.isInteger(num)) {
          errors[field.name] = `Field "${field.name}" must be an integer`;
        } else {
          sanitized[field.name] = num;
        }
        break;
      }
      case 'decimal': {
        const dec = Number(val);
        if (isNaN(dec)) {
          errors[field.name] = `Field "${field.name}" must be a valid number`;
        } else {
          sanitized[field.name] = dec;
        }
        break;
      }
      case 'boolean': {
        if (typeof val === 'boolean') {
          sanitized[field.name] = val;
        } else if (val === 'true' || val === 1) {
          sanitized[field.name] = true;
        } else if (val === 'false' || val === 0) {
          sanitized[field.name] = false;
        } else {
          errors[field.name] = `Field "${field.name}" must be a boolean`;
        }
        break;
      }
      case 'date':
      case 'datetime': {
        const date = new Date(val as string | number);
        if (isNaN(date.getTime())) {
          errors[field.name] = `Field "${field.name}" must be a valid date`;
        } else {
          sanitized[field.name] = date;
        }
        break;
      }
      case 'uuid': {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof val !== 'string' || !uuidRegex.test(val)) {
          errors[field.name] = `Field "${field.name}" must be a valid UUID`;
        } else {
          sanitized[field.name] = val;
        }
        break;
      }
      case 'enum': {
        const validValues = field.enum_values || [];
        if (!validValues.includes(String(val))) {
          errors[field.name] = `Field "${field.name}" must be one of: ${validValues.join(', ')}`;
        } else {
          sanitized[field.name] = val;
        }
        break;
      }
      default:
        sanitized[field.name] = val;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new DynamicFieldValidationError('Dynamic field validation failed', errors);
  }

  return sanitized;
};
