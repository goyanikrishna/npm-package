// Email Service coordinating providers, templates, and branding
import { configManager } from '../../config/config.manager';
import { IEmailProvider } from '../providers/email-provider.interface';
import { SmtpProvider } from '../providers/smtp.provider';
import { ResendProvider } from '../providers/resend.provider';
import { templateService } from './template.service';
import { EmailQueueHandler } from '../types';

export { EmailQueueHandler };

export class EmailService {
  private provider: IEmailProvider | null = null;
  private queueHandler: EmailQueueHandler | null = null;

  public setQueueHandler(handler: EmailQueueHandler): void {
    this.queueHandler = handler;
  }

  private getProvider(): IEmailProvider | null {
    if (this.provider) return this.provider;

    const emailConfig = configManager.getEmail();
    if (!emailConfig) return null;

    if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
      this.provider = new SmtpProvider(emailConfig.smtp, emailConfig.from);
    } else if (emailConfig.provider === 'resend' && emailConfig.resend) {
      this.provider = new ResendProvider(emailConfig.resend, emailConfig.from);
    }

    return this.provider;
  }

  public async send(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, unknown> = {},
  ): Promise<void> {
    const provider = this.getProvider();
    if (!provider) {
      // Email is not configured; silently skip or log info
      return;
    }

    const html = templateService.render(templateName, context);
    const emailConfig = configManager.getEmail();

    if (this.queueHandler) {
      await this.queueHandler({
        to,
        subject,
        html,
        from: emailConfig?.from,
      });
      return;
    }

    await provider.sendEmail({
      to,
      subject,
      html,
      from: emailConfig?.from,
    });
  }

  public async sendWelcomeEmail(
    to: string,
    data: { firstName: string; loginUrl?: string },
  ): Promise<void> {
    const branding = configManager.getBranding();
    await this.send(to, `Welcome to ${branding.project_name}!`, 'welcome', data);
  }

  public async sendForgotPasswordEmail(
    to: string,
    data: { token: string; resetUrl?: string },
  ): Promise<void> {
    const branding = configManager.getBranding();
    const resetUrl =
      data.resetUrl ||
      (branding.frontend_url
        ? `${branding.frontend_url}/reset-password?token=${data.token}`
        : undefined);

    await this.send(to, `Reset your password for ${branding.project_name}`, 'forgot-password', {
      ...data,
      resetUrl,
    });
  }

  public async sendPasswordResetSuccessEmail(to: string): Promise<void> {
    const branding = configManager.getBranding();
    await this.send(
      to,
      `Your ${branding.project_name} password has been reset`,
      'password-reset',
      {},
    );
  }

  public async sendPasswordChangedEmail(to: string): Promise<void> {
    const branding = configManager.getBranding();
    await this.send(
      to,
      `Security Notice: ${branding.project_name} password changed`,
      'password-changed',
      {},
    );
  }

  public async sendAccountDeletedEmail(to: string): Promise<void> {
    const branding = configManager.getBranding();
    await this.send(
      to,
      `Your ${branding.project_name} account has been deleted`,
      'account-deleted',
      {},
    );
  }
}

export const emailService = new EmailService();
