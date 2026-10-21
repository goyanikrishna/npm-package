import { ToolkitError } from './base.error';

export class EmailError extends ToolkitError {
  constructor(message: string = 'Failed to send email', errorCode: string = 'EMAIL_SEND_FAILED') {
    super(500, message, errorCode);
  }
}

export class EmailTemplateNotFoundError extends ToolkitError {
  constructor(templateName: string) {
    super(500, `Email template "${templateName}" not found`, 'EMAIL_TEMPLATE_NOT_FOUND');
  }
}
