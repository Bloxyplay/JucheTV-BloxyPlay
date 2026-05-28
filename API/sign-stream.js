import crypto from 'crypto';

export default function handler(req, res) {
  const origin = req.headers.origin;
  if (origin !== 'https://juche-tv-streaming.vercel.app') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const secret = process.env.STREAM_SECRET;
  const streamPath = req.query.path;

  if (!streamPath || !streamPath.startsWith('/live/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // Expires in 2 hours
  const expires = Math.floor(Date.now() / 1000) + 7200;

  const token = crypto
    .createHash('md5')
    .update(`${expires}${streamPath}${secret}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const signedUrl = `https://bloxyplaytv.duckdns.org${streamPath}?token=${token}&expires=${expires}`;

  res.json({ url: signedUrl });
}
