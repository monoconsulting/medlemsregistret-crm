Guide for CRM System Implementation
The core system architecture (Next.js 15, Prisma schema, initial tRPC setup) is established. The focus now shifts to expanding the API, implementing security controls, and integrating the AI functionalities.

--------------------------------------------------------------------------------
Step 1: Establish Security and Authentication (Critical)
Before most API routes can be finalized, authentication and authorization must be fully implemented.
1. Integrate NextAuth: Implement NextAuth with support for Google and Credentials sign-in, and configure the Prisma adapter to handle JWT sessions.
2. Secure API Routes: Create and implement tRPC middleware (isAuthed, isAdmin) to protect procedures in all routers.
3. Secure Frontend: Implement Protected routes middleware and RoleGuard components to control access to protected pages (e.g., /dashboard, /associations).
Step 2: Finalize tRPC API Routers and Business Logic
While the Association Router is fundamentally implemented, several core functions and entire Routers remain incomplete.
1. Extend Association Router: Implement support for advanced filters (such as types, activities, tags, hasEmail/hasPhone, assignedTo, dateRange, sortBy).
2. Implement Notes Router: Create CRUD functionality for notes. Requirement: Implement strict ownership control (only the author may modify or delete a note).
3. Implement Contacts Router: Create CRUD functionality, ensuring the logic correctly handles the isPrimary flag (resetting it on other contacts when a new one is set as primary).
4. Implement Tags and Groups Routers: Create CRUD functionality for both, including handling GroupMembership.
Step 3: Implement Search and Advanced Filtering
A specialized search platform is necessary to enable effective searching and filtering based on fields like CrmStatus.
1. Integrate Search Platform: Implement Meilisearch or Typesense to handle fast multi-field search and faceted search.
    ◦ Full-text search must cover the fields: name, activities, description, and contacts.
    ◦ Faceted search must support municipality, types, and national_affiliation.
2. Build Filter Components: Create advanced Multi-select filter components and a Date-range picker to complete the filter panel.
Step 4: AI Agent Integration (Main Task)
The AI functionality requires a complete pipeline connecting the frontend, the tRPC router, and the AI provider layer.
1. Implement AI Router (tRPC): Create a dedicated AI router to expose all AI services via the API.
2. Set up AI Provider Layer: Configure support for the three specified AI providers via Langchain:
    ◦ Ollama (for local GPU/streaming support).
    ◦ OpenAI (GPT-4 Turbo).
    ◦ Anthropic (Claude 3.5 Sonnet).
3. Develop AI Prompts: Implement the necessary logic for the prompt types:
    ◦ Analysis Prompts (for analyzing associations and segmentation).
    ◦ Email Generation Prompts (for generating drafts for bulk or personalized emails).
    ◦ Suggestion Prompts (for generating next-step suggestions and data enrichment proposals).
4. Build Frontend AI Components:
    ◦ Implement the Send Email Modal with a built-in AI draft panel.
    ◦ Create the AI Analysis Dialog and AI Action Button (for use on the association card).
Step 5: Implement Background Jobs and Data Export
Asynchronous data processing and export capabilities must be implemented.
1. BullMQ Integration: Set up BullMQ specifically to handle background scraping jobs.
2. Redis Integration: Ensure full Redis integration in the Next.js application for caching large scraped datasets and supporting BullMQ.
3. Export Router: Implement the Export Router (tRPC) with support for exporting data in Excel/CSV formats. This must handle export requests based on either an explicit list of IDs or a filter object.
Step 6: Finalize UI and Forms
1. Modals: Finalize the implementation of the remaining modals: Edit Association and Add Contact.
2. Form Handling: Fully integrate React Hook Form and Zod for robust form validation across all forms and modals.
3. Detail Views: Finalize the Association Detail Page by implementing Notes (in guestbook format), Contact Management, and a complete Activity Log timeline.
4. Statistics: Integrate charting solutions (like Recharts) for dashboard graphs (e.g., membership development).