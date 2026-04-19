# 🎮 Faul or Not

A modern, multiplayer, browser-based Turkish party game inspired by Taboo.

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **React 19** with Zustand state management
- **PartyKit** on Cloudflare for real-time game rooms (authoritative server)
- **Supabase** PostgreSQL for word deck & history
- **next-intl** for Turkish-first i18n
- **Framer Motion** for animations
- **CSS Modules** + CSS custom properties for styling

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env.local

# Run Next.js dev server
npm run dev

# In a separate terminal, run PartyKit dev server
npm run party:dev
```

Open [http://localhost:3000](http://localhost:3000) to play locally.

If Supabase credentials are not configured, the app falls back to an in-memory Turkish word deck.

## Project Structure

```
faulornot/
├── party/              # PartyKit authoritative game server
├── src/
│   ├── app/[locale]/   # Next.js App Router pages (i18n-aware)
│   ├── components/     # Atomic + compound React components
│   ├── features/       # Feature modules (game-engine, lobby)
│   ├── lib/            # Supabase, i18n, utils
│   ├── messages/       # Translation JSON (tr, en)
│   ├── stores/         # Zustand stores
│   └── types/          # Shared TypeScript types
└── supabase/           # SQL migrations + seed
```

## Game Modes

| Mode | Description |
|------|-------------|
| **Normal** | Classic Taboo. Describe, guess, switch turns, first to target wins |
| **Ani Ölüm** | Sudden Death. Correct answers add time, fouls subtract it |
| **Bomba Kimde** | Hot-potato bomb that resets on correct answer |

## Deployment

- **Vercel** — Next.js
- **Cloudflare (PartyKit)** — real-time server
- **Supabase** — database & future auth

See the full implementation plan for deployment details.
