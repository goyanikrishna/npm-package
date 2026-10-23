// SMTP Email Provider using Nodemailer
import nodemailer, { Transporter } from 'nodemailer';
import { IEmailProvider, ISendEmailOptions } from './email-provider.interface';
import { ISmtpConfig } from '../../config/types';
import { EmailError } from '../../errors/email.errors';

export class SmtpProvider implements IEmailProvider {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(config: ISmtpConfig, defaultFrom: string) {
    this.defaultFrom = defaultFrom;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  public async sendEmail(options: ISendEmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown SMTP error';
      throw new EmailError(`Failed to send email via SMTP: ${msg}`);
    }
  }
}
