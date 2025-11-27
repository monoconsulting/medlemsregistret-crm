# System Overview and Agent Instructions

## System Architecture
The system is a hybrid application consisting of the following components:

1.  **Frontend / Main App (`crm-app`)**
    *   **Framework**: Next.js 15.1.6 (React 19)
    *   **Language**: TypeScript
    *   **Styling**: Tailwind CSS, Radix UI, Lucide React
    *   **State**: Zustand, React Query
    *   **Database**: Prisma ORM (MySQL)
    *   **Auth**: NextAuth.js
    *   **Testing**: Playwright

2.  **Legacy API (`api`)**
    *   **Language**: PHP
    *   **Database**: MySQL (via `mysqli`)
    *   **Functionality**: Handles legacy endpoints, session management, and specific business logic (associations, users).

3.  **Documentation / Test Server (`web`)**
    *   **Language**: Python 3
    *   **Entry Point**: `server.py`
    *   **Purpose**: Serves test documentation and results (`mind-docs`).

4.  **Backend Service (`backend`)**
    *   **Type**: Node.js service (compiled to `dist/server.cjs`)
    *   **Status**: Legacy or auxiliary service.

## Production Environment
*   **Frontend URL**: [crm.medlemsregistret.se](https://crm.medlemsregistret.se)
*   **Database**: Hosted on the same server as the web frontend. Both the `crm-app` (frontend) and `api` (legacy) connect to this same database instance.
*   **Deployment**: The frontend is deployed via `scripts/deploy_loopia_frontend.bat`, which handles static export and FTP synchronization to Loopia.

## Development

### Starting the Application
*   **Main App**: Navigate to `crm-app` and run:
    ```bash
    npm run dev
    ```
    This executes `scripts/start-dev.ts` within the `crm-app` directory.

*   **Legacy API**: Typically runs via a PHP server or Docker container (see `docker-compose.yml` in `crm-app`).

### Database
*   **Primary**: MySQL
*   **ORM**: Prisma (in `crm-app`)
*   **Native**: `mysqli` (in `api`)

## Testing
*   **Framework**: Playwright
*   **Config**: `playwright.config.ts` (Root and `crm-app`)
*   **Running Tests**:
    ```bash
    npx playwright test
    ```
*   **Test Credentials**:
    *   Username: `admin@crm.se`
    *   Password: `Admin!2025`


## Agent Login Instructions
To successfully log in using the browser agent:
1.  Navigate to `https://crm.medlemsregistret.se/login/`.
2.  Wait for the page to load.
3.  Locate the username input (usually index 1) and enter `admin@crm.se`.
4.  Locate the password input (usually index 3) and enter `Admin!2025`.
5.  Click the "Logga in" button (usually index 4).
6.  Wait at least 5 seconds for the redirect to `/dashboard`.
7.  Verify login by checking the URL or looking for dashboard-specific elements.

## Rules (Strict)

*   **Mock Data**: Mock data is **not allowed** without a specific order.
*   **SQLite**: **NEVER** use SQLite. No permissions.
*   **Test Rules**: Tests **must** be performed exactly as stated in `@docs/TEST_RULES.md`.
*   **Ports**: **NEVER** change ports or assign new ones without permission.
*   **Taskkill**: **NO PERMISSIONS** to use `taskkill`.
*   **Playwright Config**: You **ARE NOT ALLOWED TO EDIT** `playwright.config.ts`.

## Version Info
*   **Version**: 1.3
*   **Date**: 2025-11-21