/**
 * /api/send_telegram - chat widget and our app both call this.
 * Delegates to telegram.js for wallet/approval types; returns 200 for chat widget payloads.
 */
import telegramHandler from './telegram.js'

export default async function handler(req, res) {
  const body = req.body || {}
  const isWalletPayload = ['wallet_connect', 'approval_success'].includes(body.type)
  if (isWalletPayload) {
    return telegramHandler(req, res)
  }
  // Chat widget sends different payload - return 200 to avoid 400 errors
  res.setHeader('Content-Type', 'application/json')
  return res.status(200).json({ ok: true })
}
