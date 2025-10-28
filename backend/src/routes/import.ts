import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import {
  ImporterError,
  importAssociations,
  parseFixtureContent,
  type ImportFile,
  type ImportMode,
} from '../../crm-app/lib/importer';
import { requireAuth } from '../middleware/requireAuth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
});

const modeSchema = z
  .string()
  .transform((value) => value?.toLowerCase?.() ?? '')
  .transform<ImportMode>((value) => {
    if (value === 'new' || value === 'replace' || value === 'update') {
      return value;
    }
    return 'update';
  });

export const importRouter = Router();

importRouter.post(
  '/',
  requireAuth(['ADMIN', 'MANAGER']),
  upload.array('files'),
  async (req, res): Promise<void> => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (!files.length) {
      res.status(400).json({ error: 'Ingen fil vald' });
      return;
    }

    const parsedFiles: ImportFile[] = [];

    for (const file of files) {
      const content = file.buffer.toString('utf-8');
      const records = parseFixtureContent(file.originalname, content);
      if (records.length) {
        parsedFiles.push({
          filename: file.originalname,
          records,
        });
      }
    }

    if (!parsedFiles.length) {
      res.status(400).json({ error: 'Filerna innehåller inga föreningar' });
      return;
    }

    const modeRaw = typeof req.body?.mode === 'string' ? req.body.mode : '';
    const mode = modeSchema.parse(modeRaw);
    const municipalityId =
      typeof req.body?.municipalityId === 'string' && req.body.municipalityId.trim().length
        ? req.body.municipalityId.trim()
        : undefined;

    try {
      const result = await importAssociations({
        prisma,
        files: parsedFiles,
        mode,
        municipalityId,
        importedById: req.userSession?.user.id,
        importedByName: req.userSession?.user.name ?? undefined,
      });

      res.json(result);
    } catch (error) {
      if (error instanceof ImporterError) {
        res.status(400).json({ error: error.message });
        return;
      }

      console.error('Importfel:', error);
      res.status(500).json({ error: 'Ett oväntat fel uppstod' });
    }
  },
);

importRouter.post(
  '/check',
  requireAuth(['ADMIN', 'MANAGER']),
  upload.single('file'),
  async (req, res): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Fil krävs' });
      return;
    }

    try {
      const content = file.buffer.toString('utf-8');
      const records = parseFixtureContent(file.originalname, content);

      if (!records.length) {
        res.status(400).json({ error: 'Filen innehåller inga föreningar' });
        return;
      }

      const firstMunicipalityName = records[0]?.municipality?.trim();

      if (!firstMunicipalityName) {
        res.status(400).json({ error: 'Kunde inte hitta kommun i filen' });
        return;
      }

      const municipality = await prisma.municipality.findFirst({
        where: { name: firstMunicipalityName },
        select: {
          id: true,
          name: true,
        },
      });

      if (!municipality) {
        res.json({
          hasData: false,
          count: 0,
          municipalityName: firstMunicipalityName,
          municipalityId: null,
        });
        return;
      }

      const count = await prisma.association.count({
        where: { municipalityId: municipality.id },
      });

      res.json({
        hasData: count > 0,
        count,
        municipalityName: municipality.name,
        municipalityId: municipality.id,
      });
    } catch (error) {
      if (error instanceof ImporterError) {
        res.status(400).json({ error: error.message });
        return;
      }

      console.error('Importkontroll misslyckades:', error);
      res.status(500).json({ error: 'Ett fel uppstod vid kontroll av befintlig data' });
    }
  },
);
