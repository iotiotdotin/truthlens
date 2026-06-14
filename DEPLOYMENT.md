# TruthLens Deployment Guide

This guide covers the steps required to publish TruthLens to GitHub and deploy it to Vercel.

## GitHub Deployment Steps

### 1. Audit Before Publishing

Before adding files to Git, verify that local-only files are ignored:

```bash
git status --short --ignored
```

Expected ignored local files include:

```text
.env.local
.next/
node_modules/
tsconfig.tsbuildinfo
```

Do not commit secrets, build output, dependency folders, logs, or temporary files.

### 2. Initialize Git

If the repository is not already initialized:

```bash
git init
```

### 3. Review Files

Check what will be committed:

```bash
git status --short
git diff --stat
```

### 4. Stage Files

After review and approval:

```bash
git add .
```

### 5. Commit

```bash
git commit -m "Prepare TruthLens for GitHub deployment"
```

### 6. Connect GitHub Remote

For GitHub user `iotiotdotin` and repository `truthlens`:

```bash
git remote add origin https://github.com/iotiotdotin/truthlens.git
```

If `origin` already exists:

```bash
git remote set-url origin https://github.com/iotiotdotin/truthlens.git
```

### 7. Push to GitHub

If the default branch is `main`:

```bash
git branch -M main
git push -u origin main
```

If you intentionally keep the current branch name:

```bash
git push -u origin master
```

## Vercel Deployment Steps

### 1. Import Repository

1. Open Vercel.
2. Select `Add New Project`.
3. Import `https://github.com/iotiotdotin/truthlens`.
4. Confirm the framework preset is `Next.js`.

### 2. Configure Build Settings

Use the default Vercel settings for Next.js:

```bash
npm install
npm run build
```

Vercel handles the production runtime for Next.js automatically.

### 3. Add Environment Variables

Add the following in Vercel Project Settings -> Environment Variables:

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | OpenAI API key used by all AI agents. |
| `OPENAI_MODEL` | No | Model name used by the OpenAI Responses API. Defaults to `gpt-5.5`. |

Recommended production values:

```bash
OPENAI_API_KEY=your_production_openai_api_key
OPENAI_MODEL=gpt-5.5
```

### 4. Deploy

After environment variables are set:

1. Trigger a Vercel deployment.
2. Wait for the production build to complete.
3. Open the generated Vercel URL.
4. Submit a test startup idea.
5. Confirm the analysis stream, report CTA, report page, and download action work.

### 5. Domain Setup

1. Go to Vercel Project Settings -> Domains.
2. Add the production domain.
3. Configure DNS records using Vercel's instructions.
4. Wait for SSL provisioning.
5. Confirm both root and `www` domains route correctly if both are configured.

## Required Environment Variables

Local `.env.local` example:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.5
```

Never commit `.env.local` or production secrets.

## Production Checklist

Before sharing the project publicly:

- [ ] `.env.local` is ignored by Git.
- [ ] No OpenAI API keys, tokens, passwords, or credentials are committed.
- [ ] `node_modules/` is ignored.
- [ ] `.next/` is ignored.
- [ ] `tsconfig.tsbuildinfo` is ignored.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Vercel environment variables are configured.
- [ ] Homepage loads in production.
- [ ] Analysis stream works in production.
- [ ] Report page opens after analysis.
- [ ] Browser back from report restores homepage state.
- [ ] Download report action works.
- [ ] Custom domain and SSL are configured if applicable.

## Security Notes

- Rotate any API key that has been exposed in a terminal, chat, issue, commit, log, or screenshot.
- Use a production-specific OpenAI key for Vercel.
- Restrict API key permissions where possible.
- Do not print environment variables in logs.
