export default async function handler(req, res) {
    // 1. Enable CORS for your interface
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. Route incoming traffic matching /recordings/amdo
    const urlPath = req.url.split('?')[0];
    if (urlPath === '/recordings/amdo' || urlPath === '/api') {
        
        const { program_id } = req.query;
        if (!program_id) {
            return res.status(400).json({ error: 'Missing program_id parameter.' });
        }

        const APP_SECRET = '069486993db4acc22c846557c8880d9a';
        const playbackApi = `https://mapi.qhbtv.com.cn/cloudlive-manage-mapi/api/topic/program/playback?program_id=${program_id}&app_secret=${APP_SECRET}&_=${Date.now()}`;

        try {
            // 3. Fetch the asset configuration from QHBTV
            const apiRes = await fetch(playbackApi, {
                headers: { 
                    'Referer': 'https://www.qhtb.cn/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            
            const data = await apiRes.json();
            
            // 4. Extract the raw QHBTV m3u8 stream location
            const rawM3u8Url = data.result?.streams?.[0]?.hls || null;

            if (!rawM3u8Url) {
                return res.status(404).json({ error: 'Recording URL not found for this program.' });
            }

            // 5. Send back the direct QHBTV target address
            return res.status(200).json({ 
                status: "success",
                program_id: program_id,
                recording_url: rawM3u8Url 
            });

        } catch (err) {
            return res.status(500).json({ error: 'Failed retrieving remote asset.', details: err.message });
        }
    }

    return res.status(404).json({ error: 'Not Found' });
}
