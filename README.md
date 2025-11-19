# TruthScope

TruthScope is a Next.js application that compares information from different sources (e.g., Wikipedia vs Grokipedia), extracts claims using LLMs, performs semantic difference analysis, and generates "Community Notes" to highlight contradictions, missing information, or bias.

## Features

- **Multi-Source Comparison**: Fetches and compares text from multiple sources.
- **AI-Powered Claim Extraction**: Uses OpenAI (or heuristics) to extract atomic facts.
- **Semantic Diff**: Identifies contradictions and missing claims using semantic analysis.
- **Knowledge Graph**: Converts claims to JSON-LD and RDF triples (Mock DKG integration).
- **Community Notes**: Generates notes for discrepancies with confidence scores.
- **Micropayments**: Simulates x402 payments for premium reports.

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API Key (optional, falls back to heuristics)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd truthscope
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Copy `.env.example` to `.env` and fill in your keys.
    ```bash
    cp .env.example .env
    ```
    *Note: If you don't have an OpenAI key, the app will use mock heuristics.*

4.  Initialize the database:
    ```bash
    npx prisma migrate dev --name init
    ```

5.  Seed the database (optional):
    ```bash
    npx tsx scripts/seed.ts
    ```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Testing

Run unit tests:

```bash
npm test
```

Run End-to-End tests (requires Playwright setup):

```bash
npx playwright test
```

## Architecture

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (via Prisma)
- **AI/ML**: OpenAI API (swappable `LLMClient`)
- **Web3**: Mock DKG Client, Mock Staking Service

## License

MIT
