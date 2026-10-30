// Email Module Type Definitions
export type EmailQueueHandler = (job: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) => Promise<void>;

