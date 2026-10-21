// Template Service using Handlebars and Dynamic Branding Injection
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { configManager } from '../../config/config.manager';
import { EmailTemplateNotFoundError } from '../../errors/email.errors';

const DEFAULT_TEMPLATES: Record<string, string> = {
  welcome: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to {{projectName}}</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background-color: {{primaryColor}}; padding: 24px; text-align: center; color: #ffffff;">
      {{#if logoUrl}}<img src="{{logoUrl}}" alt="{{projectName}}" style="max-height: 40px; margin-bottom: 12px;"><br>{{/if}}
      <h1 style="margin: 0; font-size: 24px;">Welcome to {{projectName}}!</h1>
    </div>
    <div style="padding: 24px; line-height: 1.6;">
      <p>Hello <strong>{{firstName}}</strong>,</p>
      <p>Your account has been successfully created. We are thrilled to have you with us!</p>
      {{#if loginUrl}}
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{{loginUrl}}}" style="background-color: {{primaryColor}}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Log In to Your Account</a>
      </p>
      {{/if}}
      <p>If you have any questions, feel free to contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
    </div>
    <div style="background: #f9f9fb; padding: 16px; text-align: center; font-size: 12px; color: #888;">
      &copy; {{currentYear}} {{companyName}}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,

  'forgot-password': `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset Your Password</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background-color: {{primaryColor}}; padding: 24px; text-align: center; color: #ffffff;">
      {{#if logoUrl}}<img src="{{logoUrl}}" alt="{{projectName}}" style="max-height: 40px; margin-bottom: 12px;"><br>{{/if}}
      <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
    </div>
    <div style="padding: 24px; line-height: 1.6;">
      <p>Hello,</p>
      <p>We received a request to reset your password for your <strong>{{projectName}}</strong> account.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{{resetUrl}}}" style="background-color: {{primaryColor}}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
      </p>
      <p>Or use this token: <code style="background: #eee; padding: 4px 8px; border-radius: 4px;">{{token}}</code></p>
      <p>This link is valid for 60 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
    <div style="background: #f9f9fb; padding: 16px; text-align: center; font-size: 12px; color: #888;">
      &copy; {{currentYear}} {{companyName}}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,

  'password-reset': `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Successfully Reset</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background-color: {{primaryColor}}; padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px;">Password Reset Complete</h1>
    </div>
    <div style="padding: 24px; line-height: 1.6;">
      <p>Hello,</p>
      <p>Your password for <strong>{{projectName}}</strong> has been successfully updated. You can now log in with your new password.</p>
      <p>If you did not perform this action, please contact our support immediately at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
    </div>
    <div style="background: #f9f9fb; padding: 16px; text-align: center; font-size: 12px; color: #888;">
      &copy; {{currentYear}} {{companyName}}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,

  'password-changed': `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Changed</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background-color: {{primaryColor}}; padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px;">Security Notice</h1>
    </div>
    <div style="padding: 24px; line-height: 1.6;">
      <p>Hello,</p>
      <p>Your password for <strong>{{projectName}}</strong> was recently changed. If you did this, no further action is required.</p>
      <p>If you did not make this change, please contact support right away at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
    </div>
    <div style="background: #f9f9fb; padding: 16px; text-align: center; font-size: 12px; color: #888;">
      &copy; {{currentYear}} {{companyName}}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,

  'account-deleted': `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Account Deleted</title></head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background-color: #ef4444; padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px;">Account Deleted</h1>
    </div>
    <div style="padding: 24px; line-height: 1.6;">
      <p>Hello,</p>
      <p>Your account on <strong>{{projectName}}</strong> has been successfully deleted. All your active sessions have been terminated.</p>
      <p>If this was a mistake, please reach out to our team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
    </div>
    <div style="background: #f9f9fb; padding: 16px; text-align: center; font-size: 12px; color: #888;">
      &copy; {{currentYear}} {{companyName}}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,
};

export class TemplateService {
  private compiledCache = new Map<string, handlebars.TemplateDelegate>();

  public render(templateName: string, context: Record<string, unknown> = {}): string {
    const branding = configManager.getBranding();
    const enrichedContext = {
      ...branding,
      currentYear: new Date().getFullYear(),
      ...context,
    };

    let templateSource: string | undefined = undefined;

    // Check custom template directory if specified
    const customDir = configManager.getEmail()?.templatesDir;
    if (customDir) {
      const customPath = path.join(customDir, `${templateName}.handlebars`);
      if (fs.existsSync(customPath)) {
        templateSource = fs.readFileSync(customPath, 'utf8');
      }
    }

    // Fallback to built-in templates
    if (!templateSource) {
      templateSource = DEFAULT_TEMPLATES[templateName];
    }

    if (!templateSource) {
      throw new EmailTemplateNotFoundError(templateName);
    }

    let compiled = this.compiledCache.get(templateName);
    if (!compiled || customDir) {
      compiled = handlebars.compile(templateSource);
      this.compiledCache.set(templateName, compiled);
    }

    return compiled(enrichedContext);
  }
}

export const templateService = new TemplateService();
