import { Router } from 'express';
import { z } from 'zod';

import { db } from '../../crm-app/lib/db';
import { requireAuth } from '../middleware/requireAuth';

const noteSchema = z.object({
  content: z.string().min(1, 'Anteckningstext krävs.'),
});

export const associationsRouter = Router();

associationsRouter.post(
  '/:associationId/notes',
  requireAuth(),
  async (req, res): Promise<void> => {
    const parseResult = noteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Anteckningstext saknas.' });
      return;
    }

    const { associationId } = req.params;
    if (!associationId) {
      res.status(400).json({ error: 'Förenings-ID saknas.' });
      return;
    }

    const association = await db.association.findUnique({
      where: { id: associationId },
      select: { id: true },
    });

    if (!association) {
      res.status(404).json({ error: 'Föreningen hittades inte.' });
      return;
    }

    const session = req.userSession;
    if (!session) {
      res.status(401).json({ error: 'Du måste vara inloggad.' });
      return;
    }

    const userName = session.user.name ?? 'Okänd användare';

    try {
      const note = await db.note.create({
        data: {
          associationId,
          content: parseResult.data.content,
          authorId: session.user.id,
          authorName: userName,
          tags: [],
        },
      });

      res.status(201).json(note);
    } catch (error) {
      console.error('Fel vid skapande av anteckning:', error);
      res.status(500).json({ error: 'Kunde inte skapa anteckning.' });
    }
  },
);

