/**
 * Stub for retrieve_config - returns valid JSON to prevent parse errors.
 * Called by 375 chunk (chat/support widget).
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    config: {},
    chat_data: 0,
  });
}
