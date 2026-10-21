// Email Provider Interface
export interface ISendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface IEmailProvider {
  sendEmail(options: ISendEmailOptions): Promise<void>;
}
