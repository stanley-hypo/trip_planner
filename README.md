# Trip Meal Planner (Next.js + Mantine)

A small Next.js app styled with Mantine to track lunch/dinner plans on a trip:
- Record who joins each meal
- Add/edit booking details (place, time, people, reference, etc.)
- Persist to a local JSON file (no database)

## Run locally

```bash
pnpm install   # or npm install / yarn
pnpm dev       # or npm run dev
```

Open http://localhost:3000

> Note: JSON file is written to `./data/trip.json`. This works on your own machine or any server with write access. It **will not persist on Vercel serverless** (use a VM/container or mount a volume if deploying). You can change path via `DATA_FILE=/abs/path/trip.json` env var.

## Initialize the trip
On first visit, choose date range and add participants in the modal. You can later add more participants while editing a meal (MultiSelect is creatable).

## Export
Since all data lives in `data/trip.json`, copy that file as your export/backup.
