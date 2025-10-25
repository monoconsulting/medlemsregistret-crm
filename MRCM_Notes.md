1. npm install (om du inte redan har node_modules).
2. npx prisma generate (efter schemaändringar).
3. npm run lint – ger samma ESLint/tsc-check som i Docker.
   1. npm run build – motsvarar next build och kommer att falla på exakt samma ställe som lagret [builder 5/5] RUN npm run build.