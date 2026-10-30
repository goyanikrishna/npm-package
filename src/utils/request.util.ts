// Request helper utilities
import { Request } from 'express';
import { IClientMetadata } from '../auth/types';

export const getClientMeta = (req: Request): IClientMetadata => ({
  ip_address: (req.ip || req.socket.remoteAddress) as string | undefined,
  user_agent: req.headers['user-agent'] as string | undefined,
});

