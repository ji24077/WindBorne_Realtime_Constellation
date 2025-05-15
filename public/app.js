// 지도 초기화
const map = L.map('map', {
    touchZoom: true,
    scrollWheelZoom: true,
    dragging: true,
    tap: true,
    zoomControl: true,
    attributionControl: true,
    touchExtend: true,
    bounceAtZoomLimits: false
}).setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    crossOrigin: true,
    maxZoom: 19,
    minZoom: 1
}).addTo(map);

// 전역 변수
let markers = [];
let paths = [];
let currentBalloons = {};

// 시간 범위 선택 이벤트 리스너
document.getElementById('timeRange').addEventListener('change', async (e) => {
    const hours = e.target.value;
    console.log('Selected time range:', hours);
    await fetchBalloonData(hours);
});

// 풍선 데이터 가져오기
async function fetchBalloonData(hours) {
    try {
        // hours 파라미터가 없으면 현재 시간 사용
        const currentHours = hours || new Date().getUTCHours().toString().padStart(2, '0');
        console.log('Fetching data for hours:', currentHours);
        
        const response = await fetch(`/api/balloons?hours=${currentHours}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch balloon data');
        }

        console.log('Fetched balloon data:', result);

        // 기존 마커 제거
        markers.forEach(marker => marker.remove());
        markers = [];

        // 새로운 마커 추가
        result.data.forEach(balloon => {
            // 좌표값 검증
            if (balloon.latitude == null || balloon.longitude == null || 
                isNaN(balloon.latitude) || isNaN(balloon.longitude)) {
                console.warn('Invalid coordinates:', balloon);
                return;
            }

            // 좌표 범위 검증
            if (balloon.latitude < -90 || balloon.latitude > 90 || 
                balloon.longitude < -180 || balloon.longitude > 180) {
                console.warn('Coordinates out of range:', balloon);
                return;
            }

            try {
                const marker = L.circleMarker([balloon.latitude, balloon.longitude], {
                    radius: 8,
                    fillColor: '#e74c3c',
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);

                marker.bindPopup(`
                    <div class="balloon-info">
                        <h3>기구 정보</h3>
                        <p>ID: ${balloon.id}</p>
                        <p>고도: ${balloon.altitude.toFixed(2)} km</p>
                        <p>시간: ${new Date(balloon.timestamp).toLocaleString()}</p>
                    </div>
                `);

                markers.push(marker);
            } catch (error) {
                console.error('Error adding marker:', error, balloon);
            }
        });

        // 마지막 업데이트 시간 표시
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = `마지막 업데이트: ${new Date().toLocaleString()} (${currentHours}시 데이터)`;
        }

    } catch (error) {
        console.error('Error fetching balloon data:', error);
        alert('기구 데이터를 가져오는데 실패했습니다.');
    }
}

// 지도 업데이트
function updateMap(balloons) {
    console.log('Updating map with balloons:', balloons);
    
    // 기존 마커와 경로 제거
    markers.forEach(marker => map.removeLayer(marker));
    paths.forEach(path => map.removeLayer(path));
    markers = [];
    paths = [];

    // 새로운 데이터로 마커와 경로 생성
    balloons.forEach(balloon => {
        console.log('Processing balloon:', balloon);
        
        if (balloon.lat && balloon.lon) {
            // 마커 생성
            const marker = L.circleMarker([balloon.lat, balloon.lon], {
                radius: 8,
                fillColor: '#e74c3c',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            // 마커 클릭 이벤트
            marker.on('click', () => showBalloonInfo(balloon));
            markers.push(marker);

            // 경로 생성 (이전 위치가 있는 경우)
            if (currentBalloons[balloon.id] && currentBalloons[balloon.id].lat && currentBalloons[balloon.id].lon) {
                const path = L.polyline([
                    [currentBalloons[balloon.id].lat, currentBalloons[balloon.id].lon],
                    [balloon.lat, balloon.lon]
                ], {
                    color: '#e74c3c',
                    weight: 2,
                    opacity: 0.6
                }).addTo(map);
                paths.push(path);
            }
        } else {
            console.warn('Invalid balloon coordinates:', balloon);
        }
    });

    // 현재 풍선 데이터 업데이트
    currentBalloons = balloons.reduce((acc, balloon) => {
        acc[balloon.id] = balloon;
        return acc;
    }, {});
    
    // 마커가 없는 경우 경고
    if (markers.length === 0) {
        console.warn('No valid markers were created');
    }
}

// 풍선 정보 표시
async function showBalloonInfo(balloon) {
    const infoPanel = document.getElementById('balloon-info');
    infoPanel.innerHTML = '<p>데이터를 불러오는 중...</p>';

    try {
        // 날씨 데이터 가져오기
        const weatherResponse = await fetch(`/api/weather/${balloon.lat}/${balloon.lon}`);
        const weatherData = await weatherResponse.json();

        // 대기질 데이터 가져오기
        const airQualityResponse = await fetch(`/api/air-quality/${balloon.lat}/${balloon.lon}`);
        const airQualityData = await airQualityResponse.json();

        // 위치 정보 가져오기
        const locationResponse = await fetch(`/api/location/${balloon.lat}/${balloon.lon}`);
        const locationData = await locationResponse.json();

        // 정보 패널 업데이트
        infoPanel.innerHTML = `
            <h3>풍선 ID: ${balloon.id}</h3>
            <p><strong>위치:</strong> ${locationData.display_name || '알 수 없음'}</p>
            <p><strong>고도:</strong> ${balloon.alt || '알 수 없음'} m</p>
            <p><strong>기압:</strong> ${balloon.pressure || '알 수 없음'} hPa</p>
            <p><strong>온도:</strong> ${balloon.temperature || '알 수 없음'}°C</p>
            <p><strong>습도:</strong> ${balloon.humidity || '알 수 없음'}%</p>
            <p><strong>풍속:</strong> ${balloon.wind_speed || '알 수 없음'} m/s</p>
            <p><strong>풍향:</strong> ${balloon.wind_direction || '알 수 없음'}°</p>
            <h4>현재 날씨</h4>
            <p><strong>온도:</strong> ${weatherData.current?.temperature_2m || '알 수 없음'}°C</p>
            <p><strong>습도:</strong> ${weatherData.current?.relative_humidity_2m || '알 수 없음'}%</p>
            <p><strong>풍속:</strong> ${weatherData.current?.wind_speed_10m || '알 수 없음'} km/h</p>
            <h4>대기질 정보</h4>
            <p><strong>PM2.5:</strong> ${airQualityData.results?.[0]?.measurements?.[0]?.value || '알 수 없음'} μg/m³</p>
        `;
    } catch (error) {
        console.error('Error fetching additional data:', error);
        infoPanel.innerHTML = '<p>데이터를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// 초기 데이터 로드
fetchBalloonData();

// 5분마다 데이터 갱신
setInterval(fetchBalloonData, 5 * 60 * 1000); 