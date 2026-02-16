/**
 * Stub for retrieve_id - chat widget expects this endpoint.
 * Returns valid JSON to prevent "Unexpected token 'T'" parse error from 404 HTML.
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const body = typeof req.body === 'object' ? req.body : {};
  const domain = body.domain || '';
  const userId = body.user_id || String(Date.now()).slice(-10);
  res.status(200).json({
    ok: true,
    user_id: userId,
    chat_data: 0,
  });
}
