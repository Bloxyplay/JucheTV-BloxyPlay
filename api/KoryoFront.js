export default async function handler(req, res) {
  // 1. Get the date from the incoming request (defaults to today if missing)
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: "Missing required 'date' query parameter." });
  }

  // 2. Build the exact target URL
  const targetUrl = `https://koryofront.org/api/kctv/epg?date=${date}`;

  try {
    // 3. Fetch from upstream with realistic browser headers to avoid being blocked
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    // If the upstream site gives a 404 or 500, pass that error detail through
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream server responded with status ${response.status}`
      });
    }

    const data = await response.json();

    // 4. Set CORS and content headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: `Proxy error: ${error.message}` });
  }
}
