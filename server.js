const express = require('express');
const axios = require('axios');
const url = require('url');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL missing');
    }

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'text', // म्निफेस्ट/टेक्स्ट डेटा को मॉडिफाई करने के लिए text रखा है
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://rutube.ru/'
            }
        });

        let contentType = response.headers['content-type'] || '';

        // अगर यह m3u8 प्लेलिस्ट है, तो इसके अंदर के चंक लिंक्स को भी प्रॉक्सी रूट से जोड़ दें
        if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            
            const parsedBaseUrl = new URL(targetUrl);
            const lines = response.data.split('\n');
            let modifiedLines = lines.map(line => {
                line = line.trim();
                if (line && !line.startsWith('#')) {
                    // रिलेटिव या एब्सोल्यूट यूआरएल को प्रॉक्सी के जरिए रूट करें
                    let absoluteChunkUrl = new URL(line, parsedBaseUrl).toString();
                    return `/proxy?url=${encodeURIComponent(absoluteChunkUrl)}`;
                }
                return line;
            });

            return res.send(modifiedLines.join('\n'));
        }

        // अगर यह वीडियो चंक (.ts / .mp4) या कोई अन्य फाइल है, तो सीधे स्ट्रीम कर दें
        const streamResponse = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://rutube.ru/'
            }
        });

        Object.keys(streamResponse.headers).forEach(key => {
            res.setHeader(key, streamResponse.headers[key]);
        });

        streamResponse.data.pipe(res);

    } catch (error) {
        res.status(500).send('Proxy error: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
