<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e17a16d1-3ac0-4e08-b180-a7d19c8a4372

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Cloudflare

The production deployment uses Cloudflare Workers with a D1 database.

1. Authenticate with Cloudflare:
   `wrangler login`
2. Build and deploy:
   `npm run deploy`
