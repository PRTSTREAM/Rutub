const express = require('express');
const axios = require('axios');
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
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://rutube.ru/'
            }
        });

        Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
        });

        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Proxy error: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
