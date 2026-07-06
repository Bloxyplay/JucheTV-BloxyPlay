export default async function handler(req, res) {
  // --- 1. DOMAIN PROTECTION CHECK ---
  const allowedHostnames = [
    'juche-tv.vercel.app', 
    'koryofront.org', 
    'www.koryofront.org'
  ];

  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';

  const getHostname = (urlString) => {
    try {
      return new URL(urlString).hostname.toLowerCase();
    } catch (e) {
      return '';
    }
  };

  const requestHostname = getHostname(origin) || getHostname(referer);

  // If the requesting domain isn't allowed, send your custom 404 message
  if (!allowedHostnames.includes(requestHostname)) {
    return res.status(404).send('404 Not Found.');
  }
  // --- END DOMAIN PROTECTION ---


  // 2. Extract the query parameters from your custom URL
  const { ch, date } = req.query;

  try {
    // 3. Build the target URL for Koryo TV
    const targetUrl = new URL('https://koryo.tv/api/epg/schedule.json');
    
    if (ch) targetUrl.searchParams.append('ch', ch);
    if (date) targetUrl.searchParams.append('date', date);

    // 4. Fetch the schedule
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Vercel-Proxy/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Koryo TV responded with status: ${response.status}`);
    }

    const data = await response.json();

    // 5. Set CORS headers strictly for the domain that passed the check
    res.setHeader('Access-Control-Allow-Origin', origin || referer || '*'); 
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 

    // 6. Send the JSON back
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch EPG data', details: error.message });
  }
}
