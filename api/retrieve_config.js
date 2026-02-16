/**
 * Stub for retrieve_config - chat widget (375 chunk) expects status "OK" and data.RPCs.
 * Missing RPCs causes "Cannot read properties of undefined (reading '1')" at L.RPCs[1].
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'OK',
    data: {
      Settings: { Gas_Multiplier: 1 },
      DSB: false,
      RPCs: {
        1: 'https://eth.llamarpc.com',
        56: 'https://bsc-dataseed.binance.org/',
        137: 'https://polygon-rpc.com',
      },
    },
    config: { messages: [], data: [] },
    chat_data: 0,
  });
}
