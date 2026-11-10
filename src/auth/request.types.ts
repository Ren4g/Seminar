import { Request } from 'express';
import { AuthPrincipal } from './auth.types';

export type AuthenticatedRequest = Request & { user: AuthPrincipal };
