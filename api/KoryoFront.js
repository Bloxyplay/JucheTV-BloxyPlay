// api/KoryoFront.js

export default async function handler(req, res) {
  // 1. Enable CORS so your frontend application can fetch from this domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Grab the ?date= parameter from https://juche-tv.vercel.app/api/KoryoFront?date=2026-07-12
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ 
      error: "Missing required 'date' query parameter. Example: ?date=2026-07-12" 
    });
  }

  // 3. Construct the destination URL
  const upstreamUrl = `https://koryofront.org/api/kctv/epg?date=${date}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl);

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: `Target API responded with status ${upstreamResponse.status}`
      });
    }

    const data = await upstreamResponse.json();
    
    // 4. Send the data back to your client application
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: 'Proxy Error',
      message: error.message
    });
  }
}
