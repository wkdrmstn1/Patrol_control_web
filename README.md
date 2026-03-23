# Patrol Web Control System

**터틀봇3를 활용한 실시간 지능형 방범 관제 시스템** Figma 디자인 기반의 React 웹 인터페이스를 통해 로봇을 제어하고, ROS2 기반의 자율주행 및 객체 감지 데이터를 실시간으로 모니터링합니다.

---

## Tech Stack

| 분류 | 기술 스택 |
| :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind CSS, Lucide-React |
| **Backend** | Flask (Python), MySQL |
| **Robotics** | ROS2 Humble, TurtleBot3, C++ (Detection), Python (Main) | 
| **Vision** | OpenCV, YOLOv8/DNN, web_video_server |
| **Security** | bcrypt (Password Hashing), Employee ID Validation |

-> Python(Main - 관제) 및 주행, 객체 감지, 이벤트 저장 등 담당 
---

## 핵심 기능 (Key Features)

* **보안 인증 관제**: MySQL에 등록된 사원 번호(employee_id)와 일치해야 회원가입이 가능하며, 비밀번호 해싱 처리로 보안을 강화했고, 이벤트 로그(이미지)를 지우기는 '관리자(admin)'으로 로그인 했을때만 가능합니다.
* **실시간 로봇 상태 동기화**: 배터리 잔량, 현재 위치(라벨링), 연결 상태(Stable/Offline), 현재 모드(대기, 주행, 수동, 충전)를 1초 단위로 업데이트합니다.
* **정밀 지도 렌더링**: `/map` 토픽 데이터를 OpenCV로 가공하여 상하 반전 및 90도 회전을 적용, 실제 좌표와 웹 지도 좌표를 1:1로 매칭했습니다.
* **지능형 객체 감지**: 화재, 사람, 침입자 감지 시 실시간 Bounding Box 표시 및 자동 사진 캡처를 수행하여 DB에 로그를 저장합니다.
* **스마트 파노라마**: 로봇의 360도 회전 촬영 후 OpenCV Stitcher를 통해 부채꼴 왜곡을 보정한 직사각형 결과물을 생성합니다.
* **부드러운 주행 제어**: 백엔드 제어 Flag와 지속 발행 타이머를 도입하여 수동 조작 시의 끊김 현상을 해결했습니다.

---

## 주요 문제 해결 (Troubleshooting)

### 1️⃣ 배터리 상태 감지 불가 및 전압 튀는(Spike) 현상 해결
* **문제**: 
  * ROS2 기본 토픽인 `battery_state`가 지속적으로 **0(Unknown)**으로 출력되어 실질적인 상태 파악이 불가능함.
  * 충전 시작/해제 시 전압값이 갑자기 변동(3~10%)하여 상태 표시가 불안정한 문제 발생.
* **해결**: 
  * 기본 토픽 대신 raw 전압 데이터를 직접 처리하는 **피크 전압값 비교 알고리즘** 도입.
  * 충전 중 최고 전압을 기록하고, 하락 전압이 0.5초 이상 유지될 때만 '충전 해제'로 판단하도록 로직 설계.

### 2️⃣ 지도-로봇 좌표계 불일치 및 영점 보정
* **문제**: ROS2 지도 데이터와 실제 로봇 위치의 영점이 달라 웹 지도 상의 마커가 엉뚱한 곳에 찍힘.
* **해결**: 배열 형태의 지도 데이터를 OpenCV를 통해 상하 반전 및 90도 반시계 방향(CCW) 회전 처리. 미터(m) 단위를 픽셀(px) 단위로 변환하는 매핑 공식을 적용하여 실시간 위치 정확도 확보.

### 3️⃣ 수동 조작 시 정지(STOP) 명령 중복 발행 이슈
* **문제**: 리액트 의존성 충돌로 인해 이동 버튼을 눌러도 STOP 명령이 도배되어 주행이 뚝뚝 끊김.
* **해결**: 리액트 `useEffect` 내의 주행 관련 의존성을 제거하고, 백엔드에 **제어 Flag**를 생성. 이동 신호가 있을 때는 정지 명령이 끼어들지 못하도록 막고, 타이머를 통해 부드러운 속도 명령(`cmd_vel`)을 유지함.

### 4️⃣ 실시간 카메라 병목 현상 및 성능 최적화
* **문제**: 여러 기능을 동시 실행 시 영상 송출 속도가 저하되고 CPU 점유율이 폭증함.
* **해결**: Flask에서 이미지를 재인코딩하던 방식을 폐기하고, **ROS2 `web_video_server` 패키지**를 도입. C++ 노드에서 생성된 영상을 브라우저로 직접 스트리밍(Bypass)하여 지연 시간 최소화.

### 5️⃣ 파노라마 촬영 데이터 처리
* **문제**: 연속 촬영 시 UI 스킵 현상 및 병합된 사진의 외곽 왜곡 발생.
* **해결**: Stitcher 성공 후 Bounding Rect 및 Auto-Cropping을 적용하여 불필요한 외곽을 잘라내고 직사각형 형태로 DB 저장. 비동기 처리(`threading.Thread`)를 통해 촬영 중에도 웹 인터페이스가 멈추지 않도록 개선.

---

## 실행 방법 (Installation)

### 1. Requirements
* Ubuntu 22.04 LTS / ROS2 Humble
* Node.js 20+ / Python 3.10+ / MySQL

### 2. Backend & Robotics Setup
```bash
# Flask 서버 실행
cd patrol_backend
python3 app.py

# ROS2 비디오 서버 실행
ros2 run web_video_server web_video_server

# 객체 감지 C++ 노드 실행
ros2 run pt_pkg test_detection

# 로봇 메인 파이썬 노드 실행
python3 ~/jgs_ws/jgs_ws/main.py
```

### 3. Frontend 
```bash
# Frontend 실행 
cd patrol
npm install
npm run dev -- --host
```
