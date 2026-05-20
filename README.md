# Careers Builder

A private, full-stack desktop web application that serves as both an **AI-powered CV Builder** and a **Smart Job Opportunity Searcher**.

- **CV Builder Mode:** AI-guided conversational interview that extracts professional details, structures them, and maps onto multiple design templates.
- **Job Search Mode:** Semantic search engine that reads a CV, scrapes live job postings, and ranks them by relevance.

**Design philosophy:** Local-first data security. All personal data is stored and processed on your machine.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Building for Production

```bash
pnpm build
```

Run the production server:

```bash
node dist/server/server.js
```

## Docker

```bash
docker build -t careers-builder .
docker run -p 3000:3000 careers-builder
```

## Testing

```bash
pnpm test                    # Run tests
pnpm vitest run --coverage   # Run with coverage
```

## Tech Stack

- **Framework:** TanStack Start (React) with SSR
- **Language:** TypeScript (strict mode)
- **Routing:** TanStack Router (file-based)
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Playwright
- **Containerization:** Docker (node:22-slim)
