patrol/
├── Backend (patrol_backend/)
│   ├── app.py                  # 백엔드 메인 서버 (RESTful API & DB 연동)
│   └── uploads/                # 로봇 전송 데이터 저장소
│       ├── map/                # 실시간 SLAM 지도 이미지 (.jpg) 저장
│       ├── panorama/           # 병합된 파노라마 이미지 저장
│       ├── last_waypoints.json # 웹에서 지정한 최신 경로 데이터 백업 (휘발 방지)
│       └── *.jpg               # 객체 감지(화재/침입자/도난) 시 캡처된 로그 사진
│
└── Frontend (src/app/)
    ├── App.tsx                 # 애플리케이션 메인 엔트리 및 라우팅 설정
    ├── layout.tsx              # 공통 레이아웃 및 메타데이터 정의
    ├── page.tsx                # 서비스 접속 시 첫 메인 페이지 렌더링
    ├── globals.css             # 시스템 전역 Tailwind CSS 및 애니메이션 스타일
    │
    ├── contexts/               # 전역 상태 관리 엔진
    │   ├── AuthContext.tsx     # 관리자 사원 인증 및 접근 권한 관리
    │   └── RobotContext.tsx    # 로봇 실시간 데이터(좌표/상태/경로) 통신 및 동기화
    │
    └── components/             # 화면 구성 요소 및 기능성 모달
        ├── MainScreen.tsx      # 관제 대시보드 (지도 + 카메라 + 제어 패널 통합)
        ├── ManualScreen.tsx    # 원격 수동 조작 UI (WASD 입력 처리)
        ├── StandbyScreen.tsx   # 로봇 임무 대기 전용 화면
        ├── ChargingScreen.tsx  # 충전 스테이션 도킹 시 전용 상태 화면
        ├── PanoramaScreen.tsx  # 촬영된 파노라마 이미지 전용 뷰어
        ├── LoginScreen.tsx     # 관리자 로그인 페이지
        ├── SignupScreen.tsx    # 신규 관리자 사원 등록 페이지
        ├── StatusBar.tsx       # 상단 고정 상태바 (배터리/연결/위치 실시간 표기)
        ├── RouteSettingModal.tsx # 지도 마커 기반 자율주행 경로 및 방향 설정 도구
        ├── LogHistoryModal.tsx # 감지 이벤트(로그) 리스트 및 히스토리 조회
        ├── ImageModal.tsx      # 로그 이미지 상세 보기 팝업
        ├── figma/              # 디자인 관련 유틸리티
        │   └── ImageWithFallback.tsx # 이미지 로드 실패 시 대체 이미지 처리
        └── ui/                 # 공통 버튼, 입력창 등 기본 UI 에셋
