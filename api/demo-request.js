const WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/placeholder';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getError(name, email, club, phone) {
  if (!name || !name.trim()) return 'Name is required.';
  if (!email || !email.trim()) return 'Email is required.';
  if (!club || !club.trim()) return 'Club is required.';
  if (!phone || !phone.trim()) return 'Phone is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Please provide a valid email address.';
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { name, email, club, phone } = req.body ?? {};
  const error = getError(name, email, club, phone);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        club: club.trim(),
        phone: phone.trim(),
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!webhookResponse.ok) {
      return res.status(502).json({ error: 'Failed to forward demo request.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to process demo request.' });
  }
}
