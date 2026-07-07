export default async function handler(req, res) {
  const { ch, date } = req.query;

  try {
    const targetUrl = new URL('https://koryo.tv/api/epg/schedule.json');
    
    if (ch) targetUrl.searchParams.append('ch', ch);
    if (date) targetUrl.searchParams.append('date', date);

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    // --- CUSTOM ERROR INTERCEPTION ---
    if (!response.ok) {
      // If it's a 401, 403, or any other failure code, trigger your custom message
      if (response.status === 401 || response.status === 403 || response.status >= 400) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(response.status).json({ 
          error: "Koryo TV gatekeeping the EPG I don't know why but I guess they kinda dumb!" 
        });
      }
      
      throw new Error(`Koryo TV responded with status: ${response.status}`);
    }
    // ---------------------------------

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 

    res.status(200).json(data);

  } catch (error) {
    // Fallback for network-level crashes or DNS failures
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Failed to fetch EPG data', details: error.message });
  }
}
