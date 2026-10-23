// Resend Email Provider
import { IEmailProvider, ISendEmailOptions } from './email-provider.interface';
import { IResendConfig } from '../../config/types';
import { EmailError } from '../../errors/email.errors';

export class ResendProvider implements IEmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor(config: IResendConfig, defaultFrom: string) {
    this.apiKey = config.apiKey;
    this.defaultFrom = defaultFrom;
  }

  public async sendEmail(options: ISendEmailOptions): Promise<void> {
    try {
      // Lazy load Resend SDK to make peer dependency optional
      let ResendClient: typeof import('resend').Resend;
      try {
        const mod = await import('resend');
        ResendClient = mod.Resend;
      } catch {
        throw new EmailError(
          'The "resend" package is not installed. Please install it using: npm install resend',
        );
      }

      const resend = new ResendClient(this.apiKey);
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

      const { error } = await resend.emails.send({
        from: options.from || this.defaultFrom,
        to: toAddresses,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      if (error) {
        throw new EmailError(`Resend API error: ${error.message}`);
      }
    } catch (err: unknown) {
      if (err instanceof EmailError) throw err;
      const msg = err instanceof Error ? err.message : 'Unknown Resend error';
      throw new EmailError(`Failed to send email via Resend: ${msg}`);
    }
  }
}
