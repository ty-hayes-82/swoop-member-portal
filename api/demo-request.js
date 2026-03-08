const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'https://swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app',
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getError(firstName, club, email) {
  if (!firstName || !firstName.trim()) return 'First name is required.';
  if (!club || !club.trim()) return 'Club is required.';
  if (!email || !email.trim()) return 'Email is required.';
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isEmailValid) return 'Please provide a valid email address.';
  return null;
}

export default function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { firstName, club, email } = req.body ?? {};
  const error = getError(firstName, club, email);
  if (error) {
    return res.status(400).json({ error });
  }

  console.log('Demo request submitted', {
    firstName: firstName.trim(),
    club: club.trim(),
    email: email.trim().toLowerCase(),
    submittedAt: new Date().toISOString(),
  });

  return res.status(200).json({ success: true });
}
