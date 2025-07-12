const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'https://www.mypacetracker.com', // or '*' for all, but not recommended for production
  credentials: true // if you use cookies or HTTP auth
}));

app.use((req, res, next) => {
    console.log('Incoming request:', {
        url: req.url,
        method: req.method,
        host: req.headers.host,
        headers: req.headers
    });

    const allowedHosts = [
        'localhost',
        '192.168.1.104',
        'mypacetracker.com',
        'www.mypacetracker.com',
        'api.mypacetracker.com'
    ];

    const host = req.headers.host ? req.headers.host.split(':')[0] : '';

    if (!allowedHosts.includes(host)) {
        console.error(`Invalid Host header: ${req.headers.host}`);
        return res.status(400).send('Invalid Host header');
    }
    next();
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 7755;
app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});