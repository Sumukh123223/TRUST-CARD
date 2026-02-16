/**
 * Stub for balance_frontend - returns empty balance to prevent 404.
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    usdt: 0,
    bnb: 0,
    trx: 0,
  });
}
