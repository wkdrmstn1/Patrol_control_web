patrol/
├── Backend | patrol_backend/          # Flask 기반 API 서버 (로봇 통신 및 DB 관리)
│   ├── app.py                  # 백엔드 메인 엔트리 (RESTful API 구현)
│   └── uploads/                # 데이터 저장소 (Media & JSON)
│       ├── map/                # 실시간 변환된 SLAM 지도 이미지
│       ├── panorama/           # 병합 완료된 파노라마 사진 저장
│       ├── last_waypoints.json # 웹에서 지정한 최신 경로 데이터 백업
│       └── *.jpg               # 객체감지/화재감지/도난감지 시 자동 캡처된 로그 사진
│
└── Frontend | src/app/                 # React + TypeScript 기반 프론트엔드
    ├── App.tsx                 # 메인 엔트리 및 라우팅 설정
    ├── components/             # UI 구성 요소 (각 모니터링/제어 페이지)
    │   ├── MainScreen.tsx      # 실시간 지도 및 카메라 통합 대시보드
    │   ├── ManualScreen.tsx    # WASD 키보드 원격 수동 조작 화면
    │   ├── StatusBar.tsx       # 최상단 상태바 (로봇 연결/배터리/위치 표시)
    │   ├── RouteSettingModal.tsx # 지도 마커 기반 자율주행 경로 설정 도구
    │   └── ...                 # 로그인, 회원가입, 로그 히스토리 등 각종 스크린
    └── contexts/               # 전역 상태 관리 (State Management)
        ├── RobotContext.tsx    # 로봇 데이터(좌표/상태/경로) 통신 및 상태 관리 엔진
        └── AuthContext.tsx     # 사용자 인증 및 시스템 접근 권한 관리
