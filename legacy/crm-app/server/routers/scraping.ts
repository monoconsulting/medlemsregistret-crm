import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export const scrapingRouter = router({
  runScrape: publicProcedure
    .input(z.object({ municipalityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get municipality
      const municipality = await ctx.db.municipality.findUnique({
        where: { id: input.municipalityId },
      });

      if (!municipality) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kommun hittades inte' });
      }

      // Find scrape script
      const scriptName = `${municipality.name.toLowerCase().replace(/\s+/g, '_')}_scrape.ts`;
      const scriptPath = path.join(process.cwd(), '..', 'scraping', 'scripts', scriptName);

      try {
        await fs.access(scriptPath);
      } catch {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Scrape-skript för ${municipality.name} hittades inte` });
      }

      // Create scrape run record
      const scrapeRun = await ctx.db.scrapeRun.create({
        data: {
          status: 'running',
          startedAt: new Date(),
          municipalityId: input.municipalityId,
        },
      });

      // Run the script (in background)
      execAsync(`npx tsx ${scriptPath}`)
        .then(async ({ stdout, stderr }) => {
          // Update scrape run as completed
          await ctx.db.scrapeRun.update({
            where: { id: scrapeRun.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
            },
          });
          console.log('Scrape completed:', municipality.name);
        })
        .catch(async (error) => {
          // Update scrape run as failed
          await ctx.db.scrapeRun.update({
            where: { id: scrapeRun.id },
            data: {
              status: 'failed',
              completedAt: new Date(),
              errors: { error: error.message },
            },
          });
          console.error('Scrape failed:', error);
        });

      return { scrapeRunId: scrapeRun.id };
    }),

  getJsonFiles: publicProcedure
    .input(z.object({ municipalityName: z.string() }))
    .query(async ({ input }) => {
      const jsonDir = path.join(process.cwd(), '..', 'scraping', 'json');
      const files = await fs.readdir(jsonDir);
      const municipalityFiles = files.filter(file =>
        file.toLowerCase().includes(input.municipalityName.toLowerCase()) && file.endsWith('.json')
      );

      return municipalityFiles.sort((a, b) => b.localeCompare(a)); // Newest first
    }),

  getJsonContent: publicProcedure
    .input(z.object({ fileName: z.string() }))
    .query(async ({ input }) => {
      const filePath = path.join(process.cwd(), '..', 'scraping', 'json', input.fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    }),

  updateJsonFile: publicProcedure
    .input(z.object({
      fileName: z.string(),
      content: z.any(),
    }))
    .mutation(async ({ input }) => {
      const filePath = path.join(process.cwd(), '..', 'scraping', 'json', input.fileName);
      await fs.writeFile(filePath, JSON.stringify(input.content, null, 2));
      return { success: true };
    }),
});