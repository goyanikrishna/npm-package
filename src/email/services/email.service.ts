// Email Service coordinating providers, templates, and branding
import { configManager } from '../../config/config.manager';
import { IEmailProvider } from '../providers/email-provider.interface';
import { ResendProvider } from '../providers/resend.provider';
import { SmtpProvider } from '../providers/smtp.provider';
import { EmailQueueHandler } from '../types';
import { templateService } from './template.service';

export { EmailQueueHandler };

let activeEmailProvider: IEmailProvider | null = null;
let activeQueueHandler: EmailQueueHandler | null = null;

const setEmailQueueHandler = (handler: EmailQueueHandler): void => {
  activeQueueHandler = handler;
};

const getEmailProvider = (): IEmailProvider | null => {
  if (activeEmailProvider) return activeEmailProvider;

  const emailConfig = configManager.getEmail();
  if (!emailConfig) return null;

  if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
    activeEmailProvider = new SmtpProvider(emailConfig.smtp, emailConfig.from);
  } else if (emailConfig.provider === 'resend' && emailConfig.resend) {
    activeEmailProvider = new ResendProvider(emailConfig.resend, emailConfig.from);
  }

  return activeEmailProvider;
};

const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  context: Record<string, unknown> = {},
): Promise<void> => {
  const provider = getEmailProvider();
  if (!provider) {
    // Email is not configured; silently skip or log info
    return;
  }

  const html = templateService.render(templateName, context);
  const emailConfig = configManager.getEmail();

  if (activeQueueHandler) {
    await activeQueueHandler({
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
};

const sendWelcomeEmail = async (
  to: string,
  data: { first_name: string; login_url?: string },
): Promise<void> => {
  const branding = configManager.getBranding();
  await sendEmail(to, `Welcome to ${branding.project_name}!`, 'welcome', {
    ...data,
    firstName: data.first_name,
    loginUrl: data.login_url,
  });
};

const sendForgotPasswordEmail = async (
  to: string,
  data: { token: string; reset_url?: string },
): Promise<void> => {
  const branding = configManager.getBranding();
  const reset_url =
    data.reset_url ||
    (branding.frontend_url
      ? `${branding.frontend_url}/reset-password?token=${data.token}`
      : undefined);

  await sendEmail(to, `Reset your password for ${branding.project_name}`, 'forgot-password', {
    ...data,
    reset_url,
  });
};

const sendPasswordResetSuccessEmail = async (to: string): Promise<void> => {
  const branding = configManager.getBranding();
  await sendEmail(
    to,
    `Your ${branding.project_name} password has been reset`,
    'password-reset',
    {},
  );
};

const sendPasswordChangedEmail = async (to: string): Promise<void> => {
  const branding = configManager.getBranding();
  await sendEmail(
    to,
    `Security Notice: ${branding.project_name} password changed`,
    'password-changed',
    {},
  );
};

const sendAccountDeletedEmail = async (to: string): Promise<void> => {
  const branding = configManager.getBranding();
  await sendEmail(
    to,
    `Your ${branding.project_name} account has been deleted`,
    'account-deleted',
    {},
  );
};

export const emailService = {
  setQueueHandler: setEmailQueueHandler,
  getProvider: getEmailProvider,
  send: sendEmail,
  sendWelcomeEmail,
  sendForgotPasswordEmail,
  sendPasswordResetSuccessEmail,
  sendPasswordChangedEmail,
  sendAccountDeletedEmail,
};
