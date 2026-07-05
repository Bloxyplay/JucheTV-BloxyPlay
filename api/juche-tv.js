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

  // If unauthorized, serve the completely responsive and scalable HLS player
  if (!allowedHostnames.includes(requestHostname)) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live Stream</title>
        <!-- Using a locked, highly reliable build of Hls.js -->
        <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.11/dist/hls.min.js"></script>
        <style>
          * { box-sizing: border-box; }
          body, html { 
            margin: 0; 
            padding: 0; 
            width: 100%; 
            height: 100%; 
            overflow: hidden; 
            background-color: #000;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          /* This makes the video scale perfectly inside any iframe container */
          video { 
            width: 100vw; 
            height: 100vh; 
            max-width: 100%;
            max-height: 100%;
            object-fit: contain; 
          }
        </style>
      </head>
      <body>

        <video id="video" controls autoplay playsinline muted></video>

        <script>
          const video = document.getElementById('video');
          const streamUrl = 'https://kctv.koryofront.org/stream/index.m3u8';

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            
            // Explicitly trigger play once the stream manifest parses successfully
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              video.play().catch(err => console.log("Autoplay blocked, waiting for user interaction."));
            });
          } 
          // Native fallback (Safari / iOS)
          else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', function() {
              video.play().catch(err => console.log("Autoplay blocked."));
            });
          }
        </script>
      </body>
      </html>
    `);
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
