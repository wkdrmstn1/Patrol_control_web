# app.py

# camera cmd 
## ros2 run web_video_server web_video_server
## ros2 run pt_pkg test_detection



from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymysql
import bcrypt
import json
import os
import threading
from datetime import datetime 

state_lock = threading.Lock()
cmd_lock = threading.Lock()
map_lock = threading.Lock()

current_frame = None
current_command = None
current_command_data = None
last_heartbeat = datetime.now()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

WAYPOINTS_FILE = '/tmp/last_waypoints.json'

# 폴더 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MAP_FOLDER = os.path.join(BASE_DIR, 'uploads', 'map')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
PANORAMA_FOLDER = os.path.join(BASE_DIR, 'uploads', 'panorama')
os.makedirs(MAP_FOLDER, exist_ok=True)
os.makedirs(PANORAMA_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# MAP 설정 
current_map_meta = {
    "resolution": 0.05,
    "origin_x": 0.0,
    "origin_y": 0.0,
    "width": 0,
    "height": 0
}

# DB(SQL) 설정 - 사용자 정보 유지
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '1234', 
    'db': 'patrol_db',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    return pymysql.connect(**db_config)

# 로봇 상태 데이터 유지
robot_data = {
    'battery': 0,
    'drive_status': 'IDLE',
    'power_status' : 0,
    'connection': 'Offline',
    'x': 0.0,
    'y': 0.0,
    'isDetectionRunning': False,
    'isVoiceRunning': False,
    'planned_path': [],
    'isFire': False,
    'isPerson': False,
    'isIntruder': False,
    'isTheft': False,
    'isFireDetectionOn': False,
    'isPersonDetectionOn': False
}

############################## 지도 #######################
# 1. [로봇 -> 서버] 지도 이미지 및 메타데이터 업로드 수신
@app.route('/api/map/upload', methods=['POST'])
def upload_map():
    global current_map_meta
    if 'map_image' not in request.files:
        return jsonify({"error": "No map image"}), 400
        
    file = request.files['map_image']
    filepath = os.path.join(MAP_FOLDER, 'current_map.jpg')
    file.save(filepath) # 기존 맵을 계속 덮어씌웁니다 (용량 방지)

    # 폼 데이터에서 메타데이터 추출 및 저장
    try:
        with map_lock:
            current_map_meta['resolution'] = float(request.form.get('resolution', 0.05))
            current_map_meta['origin_x'] = float(request.form.get('origin_x', 0.0))
            current_map_meta['origin_y'] = float(request.form.get('origin_y', 0.0))
            current_map_meta['width'] = int(request.form.get('width', 0))
            current_map_meta['height'] = int(request.form.get('height', 0))
    except Exception as e:
        print(f"메타데이터 파싱 에러: {e}")

    return jsonify({"status": "success"})

# 2. [웹 -> 서버] 웹에서 지도 이미지를 불러올 때 사용하는 주소
@app.route('/map/current_map.jpg')
def serve_current_map():
    return send_from_directory(MAP_FOLDER, 'current_map.jpg')

# 3. [웹 -> 서버] 클릭 좌표 계산을 위해 웹이 메타데이터를 요구할 때
@app.route('/api/map/meta', methods=['GET'])
def get_map_meta():
    with map_lock:  # 🔥 [최적화] 읽을 때도 락을 걸어 안전하게 전달
        return jsonify(current_map_meta)

############################# 지도 끝 ########################

# 로그 히스토리 사진 보기
@app.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# 파노라마 사진 보기
@app.route('/panorama/<filename>')
def serve_panorama(filename):
    return send_from_directory(PANORAMA_FOLDER, filename)

# 파노라마 이미지 업로드 
@app.route('/api/panorama/upload', methods=['POST'])
def upload_panorama():
    if 'image' not in request.files:
        return jsonify({"error": "No image file"}), 400
    
    file = request.files['image']
    
    # 1. 파일명 생성 및 파노라마 전용 폴더 저장
    filename = f"PANO_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
    filepath = os.path.join(PANORAMA_FOLDER, filename)
    file.save(filepath)

    # 2. 이미지 URL 생성 (로컬망 IP 사용)
    image_url = f"http://192.168.0.24:5000/panorama/{filename}"

    # 3. [핵심] 기존 patrol_logs 테이블에 "파노라마 촬영" 상황으로 저장
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
            INSERT INTO patrol_logs (situation, position, image_path, created_at) 
            VALUES (%s, %s, %s, %s)
            """
            # situation을 "파노라마 촬영"으로 고정하여 웹에서 구분 가능하게 함
            cursor.execute(sql, ("파노라마 촬영", "수동 조작 지점", image_url, datetime.now()))
        connection.commit()
        return jsonify({"status": "success", "url": image_url}), 200
    except Exception as e:
        print(f"파노라마 저장 실패: {e}")
        return jsonify({"status": "db_error", "message": str(e)}), 500
    finally:
        connection.close()

# 로그 히스토리 
@app.route('/api/logs', methods=['POST'])
def save_log():
    # 로봇이 보낸 파일 받기
    if 'image' in request.files:
        file = request.files['image']
        situation = request.form.get('situation', '알 수 없는 상황')
        position = request.form.get('position', '위치 미상')
        
        # 상황(situation)에 따라 저장 폴더와 URL, 파일명 분기 처리
        if '파노라마' in situation:
            filename = f"PANO_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            filepath = os.path.join(PANORAMA_FOLDER, filename)
            image_url = f"http://192.168.0.24:5000/panorama/{filename}"
        else:
            filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image_url = f"http://192.168.0.24:5000/uploads/{filename}"
            
        # 폴더에 사진 저장
        file.save(filepath)
        
        # MySQL DB에 로그 정보 저장
        connection = get_db_connection()
        try:
            with connection.cursor() as cursor:
                sql = """
                INSERT INTO patrol_logs (situation, position, image_path, created_at) 
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (situation, position, image_url, datetime.now()))
            connection.commit()
            print(f">>> [DB 저장 성공] {situation} / {image_url}")
        except Exception as e:
            print(f">>> [DB 저장 실패] {e}")
            return jsonify({"status": "db_error", "message": str(e)}), 500
        finally:
            connection.close()
        
        return jsonify({
            "status": "success", 
            "url": image_url,
            "situation": situation
        }), 200
    
    return jsonify({"status": "fail"}), 400

# [API] 로그 히스토리 조회 + 파노라마 
@app.route('/api/logs', methods=['GET'])
def get_logs():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 최신순으로 정렬해서 가져오기
            sql = "SELECT id, situation, position, image_path, created_at FROM patrol_logs ORDER BY created_at DESC"
            cursor.execute(sql)
            rows = cursor.fetchall()
            
            # 리액트 LogEntry 형식에 맞게 변환
            logs = []
            for row in rows:
                logs.append({
                    "id": str(row['id']),
                    "time": row['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                    "situation": row['situation'],
                    "position": row['position'],
                    "hasImage": True if row['image_path'] else False,
                    "imageUrl": row['image_path']
                })
            return jsonify(logs) # 리스트 형태로 반환
    except Exception as e:
        print(f"조회 실패: {e}")
        return jsonify([]), 500
    finally:
        connection.close()
    
# [API] 로그 삭제 -> admin으로 로그인 했을 때만 가능 
@app.route('/api/logs/<int:log_id>', methods=['DELETE'])
def delete_log(log_id):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # 1. 삭제 전 이미지 경로 조회 (실제 파일 삭제용)
            cursor.execute("SELECT image_path FROM patrol_logs WHERE id = %s", (log_id,))
            row = cursor.fetchone()
            
            if row and row['image_path']:
                filename = row['image_path'].split('/')[-1]
                # URL에서 파일명만 추출하여 실제 서버 폴더에서 삭제
                if "/panorama/" in row['image_path']:
                    filepath = os.path.join(PANORAMA_FOLDER,filename)
                else:
                    filepath = os.path.join(UPLOAD_FOLDER, filename)
                
                if os.path.exists(filepath):
                    os.remove(filepath)

            # 2. DB 레코드 삭제
            sql = "DELETE FROM patrol_logs WHERE id = %s"
            cursor.execute(sql, (log_id,))
            
        connection.commit()
        return jsonify({"status": "success", "message": f"로그 {log_id} 삭제 완료"}), 200
    except Exception as e:
        print(f">>> [로그 삭제 실패] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        connection.close()


# [웹 -> 서버] 명령 수신 (POST)
@app.route('/api/robot/command', methods=['POST'])
def receive_command():
    global current_command, current_command_data
    data = request.json
    cmd = data.get('command')
    
    if cmd == 'WAYPOINT_NAVIGATION':
        try:
            with open(WAYPOINTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(data.get('waypoints', []), f, ensure_ascii=False, indent=2)
        except Exception as e:
            print("경로 백업 실패:", e)

    if cmd == 'go_to_charging_zone':
        print("명령: 충전 구역으로 이동")
    elif cmd == 'set_idle':
        print("명령: 대기 모드 전환")

    with cmd_lock:
        current_command = cmd
        current_command_data = data
    return jsonify({"status": "success"})

# 이전에 설정한 웨이포인트 불러오기
@app.route('/api/map/waypoints', methods=['GET'])
def get_saved_waypoints():
    try:
        if os.path.exists(WAYPOINTS_FILE):
            with open(WAYPOINTS_FILE, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
    except Exception as e:
        pass
    return jsonify([])

# [로봇 -> 서버] 명령 확인 (GET)
@app.route('/api/robot/command', methods=['GET'])
def get_command_for_robot():
    global current_command, current_command_data
    with cmd_lock:
        command_to_send = current_command
        data_to_send = current_command_data
        current_command = None
        current_command_data = None

    if data_to_send is not None:
        # [경로 지정 등] 데이터가 있으면, 혹시 모르니 명령어 이름도 덮어씌워서 통째로 전송
        data_to_send['command'] = command_to_send
        return jsonify(data_to_send)
    else:
        # [수동 조작 등] 데이터 없이 순수 명령어만 있는 경우, 기존처럼 안전하게 전송
        return jsonify({"command": command_to_send})

# [로봇 -> 서버] 상태 업데이트 (POST)
@app.route('/api/robot/update', methods=['POST'])
def update_robot_status():
    global robot_data, last_heartbeat
    data = request.get_json(force=True)
    last_heartbeat = datetime.now()

    if data:
        with state_lock:
            last_heartbeat = datetime.now()
            robot_data.update({
                'battery': data.get('battery', robot_data['battery']),
                'drive_status': data.get('drive_status', robot_data['drive_status']),
                'connection': data.get('connection', robot_data['connection']),
                'x': data.get('x', robot_data.get('x', 0.0)),
                'y': data.get('y', robot_data.get('y', 0.0)),
                'theta': data.get('theta', robot_data.get('theta', 0.0)),
                'isDetectionRunning': data.get('isDetectionRunning', robot_data.get('isDetectionRunning', False)),
                'isVoiceRunning': data.get('isVoiceRunning', robot_data.get('isVoiceRunning', False)),
                'planned_path': data.get('planned_path', robot_data.get('planned_path', [])),
                'isFire': data.get('isFire', False),
                'isPerson': data.get('isPerson', False),
                'isIntruder': data.get('isIntruder', False),
                'isTheft': data.get('isTheft', False),
                'isFireDetectionOn': data.get('isFireDetectionOn', robot_data.get('isFireDetectionOn', False)),
                'isPersonDetectionOn': data.get('isPersonDetectionOn', robot_data.get('isPersonDetectionOn', False))
            })
            if 'power_status' in data:
                robot_data['power_status'] = int(data.get('power_status'))

    return jsonify({"status": "success"})

# [API] 로봇 수동 조작 
@app.route('/api/robot/manual', methods=['POST'])
def manual_control():
    global current_command
    data = request.json
    action = data.get('action') # 'FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'STOP'
    
    with cmd_lock:  
        current_command = f"MANUAL_{action}"
    
    print(f"수동 조작: {action}")

    return jsonify({"status": "success"})


# [API] 로봇 상태 조회 react -> flask
@app.route('/api/robot/status', methods=['GET'])
def get_robot_status():
    global robot_data, last_heartbeat

    with state_lock:
        time_diff = (datetime.now() - last_heartbeat).total_seconds()
        current_data = robot_data.copy()

    # 로봇이 보내준 power_status가 1이면 충전 중으로 판단
    # 로봇 main.py에서 robot_data['power_status']를 업데이트하고 있어야 함
    try:
        is_charging = int(current_data.get('power_status', 0)) == 1
    except (ValueError, TypeError):
        is_charging = False
    
    if time_diff > 3.0:
        current_connection = 'Offline'
        final_status = "연결 안됨"
    else:
        current_connection = 'Stable'
    
    # 주행 상태 결정 로직
    raw_drive_status = current_data.get('drive_status', 'IDLE')

    if is_charging and raw_drive_status in ["대기", "IDLE"]:
        final_status = "충전 중"
    else:
        final_status = raw_drive_status

    return jsonify({
        "battery": current_data.get('battery', 0),
        "drive_status": final_status,      # 웹에 표시될 한글 상태
        "driveStatus": final_status,       # 카멜케이스 대응
        "isCharging": is_charging,         # 리액트에서 배터리 아이콘 변경용 신호
        "connection": current_connection,
        "x": current_data.get('x', 0.0),
        "y": current_data.get('y', 0.0),
        "theta": current_data.get('theta', 0.0),
        "isDetectionRunning": current_data.get('isDetectionRunning', False),
        "isVoiceRunning": current_data.get('isVoiceRunning', False),
        "planned_path": current_data.get('planned_path', []),
        "isFire": current_data['isFire'],
        "isPerson": current_data['isPerson'],
        "isIntruder": current_data['isIntruder'],
        "isTheft": current_data['isTheft'],
        "isFireDetectionOn": current_data.get('isFireDetectionOn', False),
        "isPersonDetectionOn": current_data.get('isPersonDetectionOn', False)
    }), 200


# [API] 회원가입 
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    employee_id = data.get('employeeId').strip().lower()        # 대소문자 구분 제거 
    password = data.get('password')

    if not employee_id or not password:
        return jsonify({"error": "데이터가 부족합니다."}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            check_sql = "SELECT is_registered FROM allowed_employees WHERE employee_id = %s"
            cursor.execute(check_sql, (employee_id,))
            result = cursor.fetchone()

            if not result:
                return jsonify({"error": "승인되지 않은 사원증 번호입니다."}), 403
            
            if result['is_registered']:
                return jsonify({"error": "이미 가입 완료된 사원증 번호입니다."}), 400

            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            insert_user_sql = "INSERT INTO users (employee_id, password) VALUES (%s, %s)"
            cursor.execute(insert_user_sql, (employee_id, hashed_password))

            update_allowed_sql = "UPDATE allowed_employees SET is_registered = TRUE WHERE employee_id = %s"
            cursor.execute(update_allowed_sql, (employee_id,))

        conn.commit()
        return jsonify({"message": "사원 인증 및 회원가입 성공!"}), 201
    
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        return jsonify({"error": "가입 처리 중 오류가 발생했습니다."}), 500
    finally:
        conn.close()

# [API] 로그인 
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user_id_raw = data.get('userId') or data.get('userid')    #  대소문자 구분 제거 
    password = data.get('password')

    if not user_id_raw or not password:
        return jsonify({"error": "아이디와 비밀번호를 입력해주세요."}), 400
    
    user_id = user_id_raw.strip().lower()
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 1. DB에서 해당 사원증 번호(employee_id)를 가진 유저 조회
            sql = "SELECT * FROM users WHERE employee_id = %s"
            cursor.execute(sql, (user_id,))
            user = cursor.fetchone()

            # 2. 유저가 존재하고, 입력한 비밀번호가 DB의 암호화된 비밀번호와 일치하는지 검증
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                return jsonify({
                    "result": "success",
                    "message": "로그인 성공!",
                    "user": {
                        "employee_id": user['employee_id']
                    }
                }), 200
            else:
                # 3. 아이디가 없거나 비밀번호가 틀린 경우
                return jsonify({"error": "아이디 또는 비밀번호가 올바르지 않습니다."}), 401
    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"error": "서버 내부 오류가 발생했습니다."}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)