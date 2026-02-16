/**
 * Stub for get-ip - returns client IP or placeholder.
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    '0.0.0.0';
  res.status(200).json({ ip });
}
