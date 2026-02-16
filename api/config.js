/**
 * Runtime config from Vercel env vars (same as BEP20 reference).
 * Set in Vercel: Project → Settings → Environment Variables
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=60');
  const approvalUrl = process.env.TRUST_CARD_APPROVAL_URL || '';
  const projectId = process.env.VITE_PROJECT_ID || '11e5445365f720d1050dc106ba2e78d6';
  res.send(
    `window.TRUST_CARD_APPROVAL_URL=${JSON.stringify(approvalUrl)};` +
    `window.TRUST_CARD_PROJECT_ID=${JSON.stringify(projectId)};`
  );
}
