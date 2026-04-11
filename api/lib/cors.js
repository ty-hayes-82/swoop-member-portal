const ALLOWED_ORIGINS = [
  'https://swoop-member-portal.vercel.app',
  'https://swoop-member-portal-production-readiness.vercel.app',
];

export function cors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || origin?.includes('swoop-member-portal') && origin?.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // signal caller to return
  }
  return false;
}
