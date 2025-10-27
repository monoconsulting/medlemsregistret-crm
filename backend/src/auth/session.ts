import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';

import { config } from '../env';
import { db } from '../../crm-app/lib/db';

const tokenPayloadSchema = z.object({
  sub: z.string(),
  role: z.nativeEnum(UserRole),
  email: z.string().email().optional(),
  name: z.string().optional(),
  exp: z.number().optional(),
});

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
}

export interface Session {
  user: SessionUser;
}

const { sessionCookie } = config;

const cookieOptions = {
  httpOnly: true,
  sameSite: sessionCookie.sameSite,
  secure: sessionCookie.secure,
  domain: sessionCookie.domain,
  maxAge: sessionCookie.ttlMs,
  path: '/',
} as const;

const expiresInSeconds = Math.floor(sessionCookie.ttlMs / 1000);

export function createSessionToken(user: SessionUser): string {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    },
    config.jwtSecret,
    {
      expiresIn: expiresInSeconds,
    },
  );
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(sessionCookie.name, token, cookieOptions);
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(sessionCookie.name, {
    ...cookieOptions,
    maxAge: 0,
  });
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[sessionCookie.name];
  if (cookieToken && typeof cookieToken === 'string') {
    return cookieToken;
  }

  const authHeader = req.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export async function getSessionFromRequest(req: Request): Promise<Session | null> {
  const token = extractToken(req);
  if (!token) {
    return null;
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }

  const parsed = tokenPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    return null;
  }

  const user = await db.user.findFirst({
    where: {
      id: parsed.data.sub,
      isDeleted: false,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role,
    },
  };
}

