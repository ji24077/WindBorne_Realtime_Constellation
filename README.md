# WindBorne Realtime Constellation

WindBorne Systems의 실시간 기상 관측 기구(풍선) 데이터를 시각화하고 분석하는 웹 애플리케이션입니다.

## 주요 기능

- 실시간 풍선 위치 추적
- 24시간 동안의 비행 경로 시각화
- 각 풍선 위치의 날씨 정보 표시
- 대기질 데이터 통합
- 위치 기반 도시/국가 정보 제공

## 기술 스택

- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js, Express.js
- 지도: Leaflet.js
- API: WindBorne API, Open-Meteo API, OpenAQ API, Nominatim API

## 설치 및 실행

1. 저장소 클론
```bash
git clone [repository-url]
cd windborne-realtime-constellation
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 생성하고 다음 변수를 설정:
```
PORT=3000
GROQ_API_KEY=your_groq_api_key_here
```

4. 서버 실행
```bash
npm start
```

5. 브라우저에서 접속
```
http://localhost:3000
```

## API 엔드포인트

- `/api/balloons/:hours` - 풍선 위치 데이터
- `/api/weather/:lat/:lon` - 날씨 정보
- `/api/air-quality/:lat/:lon` - 대기질 정보
- `/api/location/:lat/:lon` - 위치 정보

## 라이선스

MIT 