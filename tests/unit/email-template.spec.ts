// Email and Template Service Unit Tests
import { templateService } from '../../src/email/services/template.service';
import { emailService } from '../../src/email/services/email.service';
import { configManager } from '../../src/config/config.manager';
import { EmailTemplateNotFoundError } from '../../src/errors/email.errors';

describe('Email & Template System', () => {
  beforeAll(() => {
    configManager.initialize({
      project: { name: 'HealthPortal' },
      database: { host: 'localhost', port: 5432, username: 'pg', database: 'db' },
      auth: {
        jwt: {
          accessTokenSecret: 'super-secret-access-token-key-12345',
          refreshTokenSecret: 'super-secret-refresh-token-key-12345',
        },
      },
      superAdmin: {
        email: 'admin@healthportal.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: 'Password123!',
      },
      branding: {
        projectName: 'HealthPortal Pro',
        companyName: 'HealthPortal Global LLC',
        primaryColor: '#0ea5e9',
        supportEmail: 'care@healthportal.com',
        frontendUrl: 'https://app.healthportal.com',
      },
      email: {
        provider: 'smtp',
        from: 'no-reply@healthportal.com',
        smtp: {
          host: 'smtp.mailtrap.io',
          port: 2525,
          auth: { user: 'test', pass: 'test' },
        },
      },
    });
  });

  describe('Template Service', () => {
    it('should render welcome template with branding variables injected', () => {
      const html = templateService.render('welcome', {
        firstName: 'Alice',
        loginUrl: 'https://app.healthportal.com/login',
      });

      expect(html).toContain('Welcome to HealthPortal Pro!');
      expect(html).toContain('Alice');
      expect(html).toContain('#0ea5e9');
      expect(html).toContain('care@healthportal.com');
      expect(html).toContain('HealthPortal Global LLC');
    });

    it('should render forgot-password template with token and reset URL', () => {
      const html = templateService.render('forgot-password', {
        token: 'abcd1234xyz',
        resetUrl: 'https://app.healthportal.com/reset-password?token=abcd1234xyz',
      });

      expect(html).toContain('Password Reset Request');
      expect(html).toContain('abcd1234xyz');
      expect(html).toContain('https://app.healthportal.com/reset-password?token=abcd1234xyz');
    });

    it('should throw EmailTemplateNotFoundError for non-existent template', () => {
      expect(() => templateService.render('non-existent-template-xyz')).toThrow(
        EmailTemplateNotFoundError,
      );
    });
  });

  describe('Email Service Queue Hook', () => {
    it('should route email to custom queue handler when configured', async () => {
      const queuedJobs: any[] = [];
      emailService.setQueueHandler(async (job) => {
        queuedJobs.push(job);
      });

      await emailService.sendWelcomeEmail('alice@example.com', {
        firstName: 'Alice',
      });

      expect(queuedJobs.length).toBe(1);
      expect(queuedJobs[0].to).toBe('alice@example.com');
      expect(queuedJobs[0].subject).toContain('Welcome to HealthPortal Pro!');
      expect(queuedJobs[0].html).toContain('Alice');
    });
  });
});
