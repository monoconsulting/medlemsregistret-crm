import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { db } from '../../crm-app/lib/db';
import { clearSessionCookie, createSessionToken, setSessionCookie } from '../auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Ogiltigt format på inloggningsdata.' });
  }

  const { email, password } = parsed.data;

  const user = await db.user.findFirst({
    where: {
      email,
      isDeleted: false,
    },
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Felaktig e-post eller lösenord.' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Felaktig e-post eller lösenord.' });
  }

  const sessionUser = {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    role: user.role,
  };

  const token = createSessionToken(sessionUser);
  setSessionCookie(res, token);

  return res.json({ user: sessionUser });
});

authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/me', (req, res) => {
  const session = req.userSession ?? null;
  res.json({
    user: session?.user ?? null,
  });
});

