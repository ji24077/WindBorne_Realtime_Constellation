const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// WindBorne API 프록시 엔드포인트
app.get('/api/balloons', async (req, res) => {
    try {
        const hours = req.query.hours?.padStart(2, '0') || '00';
        console.log('Fetching balloon data for hours:', hours);

        const response = await fetch(`https://a.windbornesystems.com/treasure/${hours}.json`);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw API response:', text);

        // NaN 값을 null로 대체
        const cleanText = text.replace(/NaN/g, 'null');
        const data = JSON.parse(cleanText);

        if (!Array.isArray(data)) {
            throw new Error('Invalid response data format: expected array');
        }

        const balloons = data.map((item, index) => {
            if (!Array.isArray(item) || item.length < 3) {
                console.log('Invalid balloon data:', item);
                return null;
            }

            const [latitude, longitude, altitude] = item;
            // NaN 값 체크
            if (isNaN(latitude) || isNaN(longitude) || isNaN(altitude)) {
                console.log('Invalid coordinates (NaN):', item);
                return null;
            }

            return {
                id: `balloon-${index}`,
                latitude,
                longitude,
                altitude,
                timestamp: new Date().toISOString()
            };
        }).filter(balloon => balloon !== null);

        res.json({
            success: true,
            data: balloons,
            metadata: {
                total: balloons.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching balloon data:', error);
        res.status(500).json({
            success: false,
            error: '기구 데이터를 가져오는데 실패했습니다',
            details: error.message
        });
    }
});

// 날씨 API 프록시 엔드포인트
app.get('/api/weather/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// 대기질 API 프록시 엔드포인트
app.get('/api/air-quality/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const response = await axios.get(
            `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=10000`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        res.status(500).json({ error: 'Failed to fetch air quality data' });
    }
});

// 위치 정보 API 프록시 엔드포인트
app.get('/api/location/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching location data:', error);
        res.status(500).json({ error: 'Failed to fetch location data' });
    }
});

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
}); 