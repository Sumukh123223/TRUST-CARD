# TRUST-CARD

trust-card.vercel.app

## Repo structure (both sites in one repo)

| Folder / Path | Purpose |
|---------------|---------|
| **Root** (`/`) | Main site (cardstrust.org / trustcard.org) — landing, cards, etc. |
| **wc-bridge** (`/wc-bridge/`) | WalletConnect bridge (user.trustcard.org) — redirect URL for wallet connection |

## Vercel deployment

- **Main site**: `trust-card.vercel.app/`
- **Bridge**: `trust-card.vercel.app/wc-bridge/`

The bridge URL is used by WalletConnect when users connect their wallet. It must be served from the same origin on Vercel (no subdomains).
