# Patrol Control System - Backend (app.py)

Backend 서버는 Flask 프레임워크를 기반으로 하며, 순찰 로봇(ROS 2)과 웹 관제 클라이언트(React) 사이의 데이터 중계 및 관리를 담당하는 중앙 허브 역할을 수행합니다. RESTful API를 통해 로봇의 실시간 상태를 수집하고 사용자의 제어 명령을 전달합니다.

## 기술 스택

- Language: Python 3.9
- Framework: Flask
- Database: MySQL (PyMySQL)
- Security: Bcrypt (비밀번호 해싱 및 검증)
- Middleware: Flask-CORS (교차 출처 자원 공유 허용)

## 주요 기능

1. 로봇 상태 및 명령 관리
- 로봇으로부터 수신한 좌표(x, y, theta), 배터리, 주행 상태 등을 메모리에 유지하며 웹에 실시간으로 제공합니다.
- 웹에서 발생한 제어 명령(주행, 정지, 수동 조작 등)을 큐잉하여 로봇이 요청 시 전달합니다.
- 멀티스레드 환경에서의 데이터 무결성을 위해 Threading Lock(state_lock, cmd_lock, map_lock)을 적용했습니다.

2. 미디어 및 맵 데이터 처리
- 로봇이 업로드한 실시간 지도(SLAM) 이미지를 저장하고 서빙합니다.
- 객체 감지(화재, 사람, 침입자, 도난) 시 전송된 이벤트 사진을 저장하고 DB에 기록합니다.
- 파노라마 촬영 결과물을 별도 폴더(uploads/panorama)에 관리하며 로그 시스템과 연동합니다.

3. 보안 및 관리자 인증
- 미리 승인된 사원 번호 리스트(allowed_employees)를 기반으로 회원가입 기능을 제공합니다.
- Bcrypt 라이브러리를 사용하여 비밀번호를 안전하게 해싱하여 저장하며, 로그인 인증을 수행합니다.

4. 경로 백업 시스템
- 웹에서 설정한 자율주행 웨이포인트 데이터를 JSON 파일(last_waypoints.json)로 백업하여 서버 재시작 시에도 이전 경로를 복구할 수 있습니다.

## API 엔드포인트 요약

### 1. 로봇 통신 인터페이스 (Robot Interface)
- POST /api/robot/update: 로봇의 실시간 센서 및 상태 데이터 수신
- GET /api/robot/command: 로봇이 수행해야 할 대기 명령 확인
- POST /api/map/upload: 변환된 지도 이미지 및 메타데이터 업로드

### 2. 관제 웹 인터페이스 (Web Interface)
- GET /api/robot/status: 웹 대시보드용 로봇 통합 상태 조회
- POST /api/robot/command: 웹 사용자의 제어 명령(주행/정지/경로지정) 수신
- GET /api/map/waypoints: 이전에 저장된 자율주행 경로 데이터 로드
- POST /api/robot/manual: 로봇 원격 수동 조작(방향키) 명령 전송

### 3. 로그 및 미디어 관리 (Logs & Media)
- GET /api/logs: 전체 감지 로그 히스토리 조회
- POST /api/logs: 감지 이벤트 발생 시 이미지 및 상황 데이터 저장
- DELETE /api/logs/<id>: 특정 로그 레코드 및 이미지 파일 삭제
- POST /api/panorama/upload: 병합 완료된 파노라마 이미지 업로드

### 4. 사용자 인증 (Authentication)
- POST /api/signup: DB에 존재하는 사원증 번호 일 경우 회원가입 승인
- POST /api/login: 'admin' 으로 접속시에만, 로그 삭제 기능 사용 가능 

## 데이터베이스 구조 (MySQL)

- users: 관리자 계정 정보 (사원번호, 암호화된 비밀번호)
- allowed_employees: 가입 가능 사원 번호 화이트리스트
- patrol_logs: 감지 상황(situation), 발생 위치(position), 이미지 경로(image_path), 생성 시간(created_at) 기록

## 설치 및 실행 방법

1. 필수 라이브러리 설치
   pip install flask flask-cors pymysql bcrypt

2. 데이터베이스 설정
   MySQL에 patrol_db 데이터베이스를 생성하고 필요한 테이블을 세팅합니다.

3. 서버 실행
   python3 app.py
