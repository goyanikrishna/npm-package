// Request helper utilities
import { IClientMetadata } from '../auth/types';
import { Request } from 'express';

export const getClientMeta = (req: Request): IClientMetadata => ({
  ip_address: (req.ip || req.socket.remoteAddress) as string | undefined,
  user_agent: req.headers['user-agent'] as string | undefined,
});
