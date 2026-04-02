# Patrol Robot - Web Bridge Node (main.py)

main.py는 ROS 2(TurtleBot3 waffle pi 기반) 자율주행 및 객체 감지 시스템과 웹 백엔드(Flask) 서버 간의 양방향 통신을 담당하는 핵심 브릿지(Bridge) 역할을 합니다. 

로봇의 실시간 상태(배터리, 위치, 지도, 카메라 영상 등)를 서버로 전송하고, 웹에서 내린 명령(자율주행, 수동조작, 객체감지, 음성인지, 화재감지 설정 변경 등)을 로봇의 각 C++ 제어 노드로 전달합니다.

## 🛠 기술 스택
- **Language**: Python 3
- **Framework**: ROS 2 (rclpy)
- **Computer Vision**: OpenCV (`cv2`), CvBridge
- **Network**: `requests` (HTTP API 통신), `ThreadPoolExecutor` (비동기 처리)

## ✨ 주요 기능
1. **상태 모니터링 및 동기화**
   - 로봇의 현재 좌표(TF/`base_footprint`), 배터리 상태, 현재 주행 모드, 주행 경로(`planned_path`)를 1초마다 웹 서버로 전송합니다.
   - 로봇의 주행 상태와 현재 위치, 카메라를 통한 실제 현장 상황을 볼 수 있습니다.
   
2. **이벤트 기반 이미지 캡처 및 로그 전송**
   - **화재, 사람, 침입자, 도난** 감지 토픽을 구독합니다.
   - 이벤트 발생 시 실시간 카메라 영상을 캡처하고, 현재 좌표와 가장 가까운 구역(Waypoint) 정보를 매칭하여 웹 서버의 로그 DB로 이미지를 전송합니다.

3. **실시간 지도 변환 및 전송**
   - ROS 2의 2D Grid Map(`/map`) 데이터를 수신받아 OpenCV를 이용해 이미지(`.jpg`)로 변환합니다.
   - 방향을 보정하고 메타데이터(resolution, origin 등)와 함께 서버에 업로드하여 웹에서 실시간 지도를 볼 수 있게 합니다.

4. **파노라마 촬영 및 병합 (OpenCV Stitching)**
   - 웹에서 파노라마 명령 수신 시, 로봇을 제자리에서 회전시키며 다수의 사진을 촬영합니다.
   - `cv2.Stitcher`를 이용해 촬영된 이미지를 하나의 파노라마 사진으로 병합하여 서버로 전송합니다.

5. **명령 중계 (Command Dispatcher)**
   - 0.1초 주기로 Flask 서버에 명령이 있는지 폴링(Polling)합니다.
   - 수동 조작(WASD), 자율 주행 시작/정지, 충전 구역 이동, 감지 시스템 ON/OFF, 음성 인식 ON/OFF 명령을 받아 ROS 2 토픽으로 변환하여 발행(Publish)합니다.
   - 웹에서 지정한 경로(Waypoints)를 수신하여 로컬 `.yaml` 파일로 저장하고 내비게이션 노드에 전달합니다.

## 📡 ROS 2 토픽 (Topics)

### Subscriptions (구독)
- `/planned_path` (nav_msgs/Path): C++ 노드에서 계산한 주행 경로
- `/image_raw/compressed` (sensor_msgs/CompressedImage): 카메라 압축 영상
- `/battery_state` (sensor_msgs/BatteryState): 로봇 배터리 상태
- `/map` (nav_msgs/OccupancyGrid): 2D 슬램/내비게이션 지도 데이터
- `/person_detected`, `/fire_detected`, `/intruder_detected`, `/theft_detected` (std_msgs/Bool): 각종 객체/위험 감지 신호
- `/cpp_node_heartbeat`, `/voice_node_heartbeat` (std_msgs/Bool): 타 노드 생존 확인

### Publishers (발행)
- `/cmd_vel` (geometry_msgs/Twist): 로봇 수동 조작 및 파노라마용 회전 속도 명령
- `/toggle_fire_detection`, `/toggle_person_detection`, `/toggle_voice_node` (std_msgs/Bool): 감지/음성 노드 활성화 스위치
- `/cpp_nav_command` (std_msgs/String): 자율주행 노드 제어 명령 (`once`, `loop`, `stop`, `charging`, 구역 이름 등)

## 🌐 통신 API 엔드포인트 (Flask)
- **POST** `/api/robot/update`: 로봇의 실시간 상태 데이터 전송
- **GET/POST** `/api/robot/command`: 웹에서 내린 제어 명령 수신 및 초기화
- **POST** `/api/logs`: 객체 감지 및 파노라마 촬영 완료 시 이미지와 로그 데이터 전송
- **POST** `/api/map/upload`: 변환된 실시간 지도 이미지 및 메타데이터 업로드

## 🚀 실행 방법
```bash
# ROS 2 환경 소싱 후 실행
ros2 run <package_name> <executable_name>
# 또는 python 스크립트로 직접 실행
python3 main.py
```
