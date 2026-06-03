# Production Guide

This guide explains how to:

1. Push this project to GitHub
2. Deploy it online
3. Understand the easiest path
4. Understand what is needed for Vercel specifically

## Quick reality check

This project is now much closer to Vercel than before because it no longer depends on persistent song storage.

However, **the repo is still not Vercel-ready as-is** for one important reason:

- `server/index.ts` starts a long-running Express server
- Vercel expects **serverless functions**, not a permanently running Node server
- PDF generation currently uses `playwright` directly, which often needs an additional serverless-friendly browser setup on Vercel

So there are two practical paths:

## Path A: easiest path that works today

Use:

- GitHub for source control
- Railway or Render for hosting

This is the lowest-friction path for the current codebase because it can run the existing Express server directly.

## Path B: Vercel path

Use:

- GitHub for source control
- Vercel for hosting

This is possible, but it requires a small deployment adaptation:

1. Replace the long-running Express entrypoint with Vercel Functions
2. Make PDF generation use a Vercel-compatible browser runtime

If you want, I can do that refactor for you in the next step. This document explains the deployment process and the required changes.

---

## Part 1: Push to GitHub

### 1. Create a GitHub repository

In GitHub:

1. Click `New repository`
2. Choose a name
3. Keep it `Private` or `Public`
4. Do **not** initialize it with a README if this folder already exists locally

### 2. Initialize Git locally if needed

From the project root:

```bash
git init
git add .
git commit -m "Initial commit"
```

If the repo already exists locally, skip this.

### 3. Connect local repo to GitHub

Replace `YOUR-USER` and `YOUR-REPO`:

```bash
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git branch -M main
git push -u origin main
```

After that, every new deploy-friendly change should be committed and pushed:

```bash
git add .
git commit -m "Update deployment setup"
git push
```

---

## Part 2: Deploy online the easy way

## Recommended for current code: Railway or Render

Because this repo already runs as:

```bash
npm install
npm run dev
```

and in production as:

```bash
npm run build
npm start
```

it maps naturally to platforms that run a normal Node server.

### Railway steps

1. Go to `https://railway.app`
2. Sign in with GitHub
3. Click `New Project`
4. Choose `Deploy from GitHub repo`
5. Select this repository
6. Railway should detect Node automatically
7. Set:

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

8. Deploy

### Notes for Railway

- Make sure `npx playwright install chromium` is handled during build if the runtime image does not already contain Chromium
- In some cases you may also need to add:

```bash
npx playwright install --with-deps chromium
```

inside the build pipeline

If you want, I can also prepare a `railway.json` or deployment-ready build notes for Railway.

---

## Part 3: Vercel deployment

## Important

This section explains how to make **this app work on Vercel**.

### Why the current repo is not enough by itself

Vercel’s model is based on deployments and functions, not on a single always-running Express server.

Useful official references:

- Importing a Git repo into Vercel:
  https://vercel.com/docs/getting-started-with-vercel/import
- Deploying from Git:
  https://vercel.com/docs/deployments/deployment-methods
- Vercel Functions overview:
  https://vercel.com/docs/functions/
- Node runtime on Vercel Functions:
  https://vercel.com/docs/functions/runtimes
- Function duration config and limits:
  https://vercel.com/docs/functions/configuring-functions/duration
  and
  https://vercel.com/docs/functions/limitations/

As of the Vercel docs pages last updated in late 2025 and early 2026, Node functions run within function limits and durations, so PDF generation must fit that execution model.

## What must change for Vercel

### Required change 1: move Express routes into serverless functions

Today, the app uses:

- `server/index.ts`
- `server/routes/songRoutes.ts`

For Vercel, the usual approach is:

1. keep the route logic
2. export it through a function entrypoint such as:

```text
/api/index.ts
```

or split into:

```text
/api/convert-txt.ts
/api/upload-cho.ts
/api/generate-pdf.ts
```

### Required change 2: adapt PDF generation for serverless

Today, PDF generation uses:

- `playwright`

That works well locally and on a normal Node host, but on Vercel you usually need one of these approaches:

1. `playwright-core` + a serverless Chromium package
2. remote browser rendering service

The most common Vercel-friendly option is:

- replace `playwright` with `playwright-core`
- add a serverless Chromium package such as `@sparticuz/chromium`

That is the part I would recommend implementing before importing into Vercel.

---

## Part 4: Minimal Vercel target architecture

The simplest Vercel architecture for this repo is:

### Frontend

- Vite React app deployed as static assets

### Backend

- Vercel Functions for:
  - `POST /api/convert-txt`
  - `POST /api/upload-cho`
  - `POST /api/generate-pdf`

### Session behavior

- no persistent storage
- no database required
- no filesystem dependency required

That is good news because the current app already uses ephemeral session behavior.

---

## Part 5: Files you will likely need for Vercel

These are the files I would normally add in a Vercel refactor:

### 1. `vercel.json`

Example:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

This example is only a starting point. It must match the final API file layout.

### 2. Vercel API entrypoints

Examples:

```text
/api/convert-txt.ts
/api/upload-cho.ts
/api/generate-pdf.ts
```

or a single adapter file if you keep a unified handler.

### 3. Frontend build config

Vite usually works fine on Vercel, but the final config should ensure:

- frontend builds to static files
- API requests target `/api/...`
- no local dev-only proxy assumptions remain

---

## Part 6: Actual Vercel deploy steps after adaptation

Once the Vercel-specific refactor is done:

### 1. Push the updated code to GitHub

```bash
git add .
git commit -m "Prepare Vercel deployment"
git push
```

### 2. Import into Vercel

1. Go to `https://vercel.com/new`
2. Sign in with GitHub
3. Select the repository
4. Click `Import`

### 3. Configure build settings

Typical values:

Framework preset:

```text
Other
```

Install command:

```bash
npm install
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist/client
```

### 4. Add environment variables if needed

If PDF generation uses remote browser or Chromium-related config, define the necessary environment variables in:

`Project Settings -> Environment Variables`

### 5. Deploy

Click `Deploy`.

Every future push to `main` can automatically trigger a redeploy.

---

## Part 7: What I recommend for this project

### Best immediate option

If your goal is:

- deploy fast
- no extra refactor
- keep the current code mostly unchanged

then use:

- GitHub
- Railway

### Best Vercel option

If your goal is:

- Vercel specifically
- serverless hosting
- clean frontend + function deployment

then the right next step is:

1. adapt Express routes into Vercel Functions
2. adapt Playwright PDF generation to a serverless-friendly Chromium setup
3. deploy through GitHub import

---

## Part 8: Recommended next step

If you want this to **actually work on Vercel**, the next practical task is:

### “Refactor this repo for Vercel”

That would include:

1. creating `api/*.ts`
2. removing dependency on `server/index.ts` as the production entrypoint
3. preparing `vercel.json`
4. adapting PDF generation for Vercel-compatible Chromium
5. testing `npm run build`

If you want, I can do that refactor next and leave the repo ready to connect to GitHub and deploy on Vercel directly.
