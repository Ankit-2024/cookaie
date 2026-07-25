# Cookaie — Minimalist Culinary Data Aggregator (V1)

[![CI/CD Pipeline](https://github.com/Ankit-2024/cookaie/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Ankit-2024/cookaie/actions)
![Next.js](https://img.shields.io/badge/Next.js-16.2.7-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-7.9.0-5A67D8?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-06B6D4?logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-node:20--alpine-2496ED?logo=docker)

**Cookaie** is an enterprise-hardened, minimalist culinary data aggregator. It transforms user prompts into structured recipes, pairs them with relevant YouTube video tutorials, converts ingredients into real retail grocery SKUs for instant quick-commerce carting (Swiggy Instamart), and persists history into a serverless PostgreSQL database.

---

## 🚀 Key Features (V1 Scope)

### 🍳 AI-Powered Recipe Generation & Guardrails
- **Google Gemini 2.5 Flash**: Generates structured JSON recipes containing exact prep times, cook times, ingredients, and step-by-step instructions.
- **Retail Packaging Mapping**: Translates abstract units (e.g. "3 onions") into real Indian retail package sizes (e.g. "1kg Red Onions").
- **Culinary Prompt Guardrails**: Rejects non-culinary or prompt injection attempts with custom error handling.

### 🎥 Multi-Source Data Aggregation
- **YouTube Data API v3**: Concurrently fetches top recipe video tutorials alongside LLM generation.
- **Swiggy Instamart Cart Engine**: Maps recipe ingredients against catalog SKUs to calculate item totals, delivery fees, and estimated delivery times with checkout link generation.

### 🔐 Security & Rate Limiting (Phase 1)
- **Zod Schema Validation**: Enforces strict request body parsing on API endpoints (`/api/cart`).
- **Upstash Redis Rate Limiting**: Implements sliding window rate limiting (10 req/10s per IP) with fail-open protection.
- **HTTP Security Headers**: Strict Content Security Policy (CSP), HSTS preload, X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).

### 🐳 Containerization & CI/CD (Phase 2)
- **Multi-Stage Dockerfile**: Builds a minimal `node:20-alpine` standalone image (~140MB) running as a non-root `nextjs` user.
- **Automated GitHub Actions**: CI/CD pipeline (`.github/workflows/ci-cd.yml`) gating builds on linting and standalone compilation.

### 📊 Observability & Telemetry (Phase 3)
- **Pino JSON Logging**: Output formatted for cloud log parsers (GCP Cloud Logging, Datadog, AWS CloudWatch).
- **AI Latency & Token Telemetry**: Tracks Gemini latency (`durationMs`), prompt tokens, completion tokens, and total token usage without blocking responses.
- **Sentry Integration**: Global error tracking across client, server, and edge runtimes with App Router navigation performance instrumentation.

### 🗄️ Serverless Database & Persistence (Phase 4)
- **Prisma 7 ORM**: Configured via `prisma.config.ts` using `@prisma/adapter-pg` driver adapters for serverless PostgreSQL (Supabase / Neon).
- **Database History API**: `/api/recipes` `POST` and `GET` endpoints replacing browser `localStorage` with server-side persistence.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Styling** | TailwindCSS v4, Lucide Icons |
| **AI / LLM** | `@google/genai` (Gemini 2.5 Flash) |
| **Database & ORM** | PostgreSQL, Prisma 7 ORM (`@prisma/adapter-pg`) |
| **Caching & Rate Limiting** | Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) |
| **Logging & Telemetry** | Pino (`pino`), Sentry (`@sentry/nextjs`) |
| **Validation** | Zod (`zod`) |
| **Runtime & Container** | Node.js 20 LTS, Docker (`node:20-alpine`) |

---

## 📁 Project Structure

```text
cookaie/
├── app/
│   ├── api/
│   │   ├── cart/         # Zod validated Instamart SKU cart builder
│   │   ├── recipe/       # Gemini AI + YouTube video search & telemetry
│   │   └── recipes/      # Prisma PostgreSQL recipe history API
│   ├── settings/         # User dietary preferences & allergen settings
│   ├── layout.js         # Root layout
│   └── page.js           # Main search interface & recipe view
├── components/           # UI components (RecipeDetails, InstamartCart, etc.)
├── lib/
│   ├── logger.js         # Pino JSON structured logger singleton
│   ├── prisma.js         # Prisma 7 driver adapter singleton
│   ├── rate-limit.js     # Upstash Redis sliding-window rate limiter
│   └── validation.js     # Zod schema definitions
├── prisma/
│   └── schema.prisma     # Database models (Recipe, CartItem)
├── .github/workflows/    # GitHub Actions CI/CD pipeline
├── Dockerfile            # Cloud-agnostic multi-stage Docker build
├── next.config.mjs       # Security headers (CSP, HSTS) + Sentry config
├── prisma.config.ts      # Prisma 7 CLI configuration
├── sentry.client.config.js
├── sentry.server.config.js
└── sentry.edge.config.js
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# AI & Video APIs
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key

# Quick Commerce API
SWIGGY_API_KEY=your_swiggy_api_key

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# PostgreSQL Database (Prisma 7)
DATABASE_URL=postgresql://user:pass@host:5432/cookaie?sslmode=require
DIRECT_URL=postgresql://user:pass@host:5432/cookaie

# Sentry Telemetry & Error Tracking (Optional)
SENTRY_DSN=https://your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn
```

---

## 🏃 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ankit-2024/cookaie.git
   cd cookaie
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Sync database schema**:
   ```bash
   npx prisma db push
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

To build and run the production image locally using Docker:

```bash
# 1. Build the standalone image
docker build -t cookaie-prod .

# 2. Run the container with local environment variables
docker run -d \
  --name cookaie-app \
  -p 3000:3000 \
  --env-file .env.local \
  cookaie-prod
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
