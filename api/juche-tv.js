export default async function handler(req, res) {
  const { ch, date } = req.query;

  try {
    const targetUrl = new URL('https://koryo.tv/api/epg/schedule.json');
    
    if (ch) targetUrl.searchParams.append('ch', ch);
    if (date) targetUrl.searchParams.append('date', date);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        // More convincing User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        // Trick the server into thinking this request came from their own site
        'Referer': 'https://koryo.tv/',
        'Origin': 'https://koryo.tv',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    // --- CUSTOM ERROR INTERCEPTION ---
    if (!response.ok) {
      // Grab the actual server response (it might be a Cloudflare block page)
      const errorText = await response.text(); 
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(response.status).json({ 
        error: "Koryo TV gatekeeping the EPG I don't know why but I guess they kinda dumb!",
        statusCode: response.status,
        serverSaid: errorText.substring(0, 500) // First 500 chars to help you debug
      });
    }
    // ---------------------------------

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 

    res.status(200).json(data);

  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'Failed to fetch EPG data', details: error.message });
  }
}
