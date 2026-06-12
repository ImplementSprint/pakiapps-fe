# PakiPark Frontend

Next.js frontend for the PakiPark parking reservation experience.

## Local Commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Structure

```text
paki-park/
├── public/          Static assets served by Next.js
├── src/
│   ├── app/         App Router pages and layouts
│   ├── components/  Shared UI and feature components
│   ├── lib/         Frontend utilities and API client
│   └── services/    API-facing frontend service modules
└── tests/           Unit and E2E test entry points
```

Set `NEXT_PUBLIC_API_BASE_URL` when the frontend should call a deployed API.

Unit tests emit `coverage/coverage-summary.json` for the CI coverage gate.
