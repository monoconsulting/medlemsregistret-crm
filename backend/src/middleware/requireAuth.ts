import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';

export function requireAuth(roles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = req.userSession ?? null;
    if (!session) {
      return res.status(401).json({ error: 'Du måste vara inloggad.' });
    }

    if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
      return res
        .status(403)
        .json({ error: 'Du saknar behörighet för att utföra denna åtgärd.' });
    }

    return next();
  };
}

