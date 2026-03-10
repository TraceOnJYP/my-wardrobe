# Smart Wardrobe

AI Smart Wardrobe system.

## Features

* digital wardrobe
* daily outfit records
* wardrobe analytics
* AI outfit recommendation
* excel import
* local first sync
* bilingual interface

## Tech stack

Frontend:
Next.js
Tailwind

Backend:
Next.js API
Prisma

Database:
PostgreSQL

## Project structure

- `app/`: Next.js App Router pages and REST API routes
- `components/`: UI and feature components
- `server/`: service-layer logic
- `prisma/`: Prisma schema
- `docs/`: architecture, database, backend, frontend, sync, mobile design docs

## Quick start

1. Install Node.js 20+ and npm.
2. Copy `.env.example` to `.env`.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Start the app with `npm run dev`.

## Current status

The repository now contains an initial code skeleton for:

- i18n-aware App Router pages
- REST API route placeholders
- Prisma data model baseline
- wardrobe, OOTD, insights, search, and profile page scaffolding
