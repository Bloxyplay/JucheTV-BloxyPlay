export default async function handler(req, res) {
  // 1. Extract the query parameters from your custom URL
  const { ch, date } = req.query;

  try {
    // 2. Build the target URL for Koryo TV
    const targetUrl = new URL('https://koryo.tv/api/epg/schedule.json');
    
    // If you want to pass the parameters along to Koryo TV:
    if (ch) targetUrl.searchParams.append('ch', ch);
    if (date) targetUrl.searchParams.append('date', date);

    // 3. Fetch the schedule
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Vercel-Proxy/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Koryo TV responded with status: ${response.status}`);
    }

    let data = await response.json();

    /* 
      OPTIONAL FILTERING:
      If Koryo TV ignores the ?ch= and ?date= parameters and returns 
      the entire schedule anyway, you can filter the JSON here before 
      sending it back to your app.
      
      Example (uncomment and adjust based on Koryo's exact JSON structure):
      
      if (date && Array.isArray(data)) {
         data = data.filter(item => item.date === date);
      }
    */

    // 4. Set CORS and Cache headers
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache for 1 hour

    // 5. Send the JSON back to the user
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch EPG data', details: error.message });
  }
}
