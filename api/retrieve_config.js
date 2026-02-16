/**
 * Stub for retrieve_config - returns valid JSON to prevent parse errors.
 * Called by 375 chunk (chat/support widget).
 * config.messages and config.data as arrays avoid "reading '1'" TypeError.
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    config: {
      messages: [],
      data: [],
    },
    chat_data: 0,
    data: [],
  });
}
