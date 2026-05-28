const crypto = require('crypto');

module.exports = function handler(req, res) {
  const secret = process.env.STREAM_SECRET;
  const streamPath = req.query.path;

  if (!streamPath || !streamPath.startsWith('/live/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const expires = Math.floor(Date.now() / 1000) + 7200;

  const token = crypto
    .createHash('md5')
    .update(`${expires}${streamPath}${secret}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const signedUrl = `https://bloxyplaytv.duckdns.org${streamPath}?token=${token}&expires=${expires}`;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ url: signedUrl });
};
