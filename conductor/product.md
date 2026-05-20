# Initial Concept

A private, full-stack desktop web application running on the user's laptop, serving two core functions:
- **CV Builder Mode:** AI-guided conversational interview that extracts professional details, structures them, and maps onto multiple design templates.
- **Job Search Mode:** Semantic search engine that reads a CV, scrapes live job postings via automated scrapers/APIs, and ranks them by contextual relevance.

**Design philosophy:** local-first data security. All personal data is stored and processed on the user's machine. Conversational AI features send text to a cloud LLM provider — that text is never stored or trained on by the provider per their API terms.

---

# Product Definition

## 1. Executive Summary

A private, full-stack desktop web application that serves as both an AI-powered CV Builder and a Smart Job Opportunity Searcher. The application runs entirely on the user's local machine via Docker, with all personal data stored locally. Only conversational AI text is sent to a cloud LLM provider under strict no-retention API terms.

## 2. Target Audience

- **Primary Persona:** Professionals who want data sovereignty, protection from third-party resume trackers, and context-aware job listings without data harvesting.
- **Secondary Persona:** Career changers needing guided CV building and targeted job discovery.
- **Value Proposition:** Minimal data exposure — only conversation text reaches the LLM provider under no-retention terms. No cloud storage costs, multi-template design from a single data source, AI-driven filtering that acts as a private career recruiter.

## 3. Core Features

### Mode 1: AI-Powered CV Builder

#### Guided Chat Interview
- Interactive real-time chat wizard where the AI acts as an executive resume writer.
- AI prompts section-by-section (Contact, Executive Summary, Experience, Education, Skills, Projects) with adaptive follow-up questions.
- Streaming responses with visual highlights of the section being extracted.
- Users can pause the interview, edit parsed information manually in an adjacent form, and resume the conversation.

#### Multi-Template Visual Engine
- User data serializes into a unified, version-controlled schema decoupled from presentation layers.
- Multi-column visual toggle for template selection (Modern Minimalist, Executive Traditional, Creative Tech).
- Template switching re-renders instantly without data mutation or re-typing.
- PDF export must be pixel-perfect, multi-page, and ATS-compliant (selectable text, no locked shapes).

### Mode 2: Smart Job Opportunity Searcher

#### Target Vector Formulation
- Users can select any saved CV version as the "Active Targeting Profile."
- System passes the profile to a local text-processing pipeline to generate a semantic profile.

#### Automated Live Sourcing
- "Initiate Career Sweep" triggers local web scraping across publicly accessible job boards.
- Search parameters inferred from the CV: geographic requirements, remote eligibility, title hierarchies.
- UI displays estimated coverage per source with a caveat that results are best-effort.
- Authenticated/protected job sites (LinkedIn, Indeed, Glassdoor) are explicitly excluded.

#### Local Vector Matching & Optimization
- Each scraped job posting is embedded locally in real-time.
- Distance query compares job description vectors against the active CV vector.
- Results ordered strictly by context match score.
- Asynchronous post-processing agent evaluates top matches, extracts missing skills, compensation ranges, company insights, and match rationale.

## 4. UI/UX Principles

- **Layout:** Persistent sidebar navigation toggling between CV Builder View and Job Search Matrix.
- **State Transparency:** Visual indicator for CPU/memory during local embedding, network request tally during web crawling.
- **Result Feedback:** Inline thumbs up/down on each job result row. Feedback stored locally and used to adjust future result ranking.
- **Printing Fidelity:** Real-time preview matching paper proportions (A4/Letter) with printable CSS masking interface chrome during export.
- **First-run wizard:** Guides the user through LLM provider setup in under 3 steps.

## 5. Key Constraints

- **Environment:** Must run on Windows, macOS, and Linux without OS-specific code paths.
- **RAM budget:** Maximum 4 GB host memory.
- **Disk budget:** Maximum 1 GB for the application image + dependencies.
- **GPU:** No GPU acceleration assumed — all local ML runs on CPU via ONNX runtime.
- **LLM dependency:** Requires active internet connection and valid API key for conversational features.
- **Offline mode:** CV editing, template switching, and PDF export work fully offline.
- **Scraping:** Targets only public, unauthenticated job listing pages. No CAPTCHA bypass.

## 6. Out of Scope

- Multi-user or team collaboration features.
- Native mobile apps (iOS/Android) — web-only.
- Direct job application submission through the platform.
- User-customizable template editor.
- AI-powered cover letter or thank-you note generation.
- Cloud-hosted or SaaS version of the application.
