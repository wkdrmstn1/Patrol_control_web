import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export type RobotStatus = 'idle' | 'charging' | 'running' | 'stopped' | 'manual';
export type RobotMode = 'auto' | 'manual' | 'stopped';
export type AutoMoveMode = 'once' | 'loop';

interface Waypoint{
  x : number;
  y : number;
  label : string;
}

interface RobotPosition {
  x: number;
  y: number;
  theta? : number;
  label? : string;
}

interface LogEntry {
  id: string;
  situation: string;
  position: string;
  time: string;
  hasImage: boolean;
  imageUrl: string;
}

interface RobotContextType {
  isFire: boolean;
  isPerson: boolean;
  isIntruder: boolean;
  isDetectionRunning: boolean;
  isDetectionOn: boolean;
  isVoiceRunning: boolean;
  isVoiceOn: boolean;
  toggleDetection: (enabled: boolean) => Promise<void>;
  toggleVoice:(enabled: boolean) => Promise<void>;
  status: RobotStatus;
  mode: RobotMode;
  battery: number;
  isCharging: boolean;
  connection: string;
  position: RobotPosition;
  location: string;
  logs: LogEntry[];
  autoMode: 'once' | 'loop';
  routePoints: RobotPosition[];
  plannedPath: RobotPosition[];
  setMode: (mode: RobotMode) => void;
  setAutoMode: (mode: 'once' | 'loop') => void;
  setRoutePoints: (points: RobotPosition[]) => void;
  startRobot: () => void;
  stopRobot: () => void;
  stopCharging: () => Promise<void>;
  startCharging: () => Promise<void>;
  addLog: (entry: Omit<LogEntry, 'id'>) => void;
  refreshLogs: () => Promise<LogEntry[]>;
  takePanorama: () => Promise<void>;
}

const RobotContext = createContext<RobotContextType | undefined>(undefined);

export function RobotProvider({ children }: { children: React.ReactNode }) {
  const [battery, setBattery] = useState(0);
  const [driveStatus, setDriveStatus] = useState('IDLE');
  const [isCharging, setIsCharging] = useState(false);
  const [connection, setConnection] = useState('None');
  const [mode, setMode] = useState<RobotMode>('stopped');
  const [position, setPosition] = useState<RobotPosition>({ x: 0, y: 0 });
  const [autoMode, setAutoMode] = useState<'once' | 'loop'>('once');
  const [routePoints, setRoutePoints] = useState<RobotPosition[]>([]);
  const [plannedPath, setPlannedPath] = useState<RobotPosition[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDetectionOn, setisDetectionOn] = useState(false);
  const [isDetectionRunning, setisDetectionRunning] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [isVoiceRunning, setisVoiceRunning] = useState(false);
  const [isFire, setIsFire] = useState(false);
  const [isPerson, setIsPerson] = useState(false);
  const [isIntruder, setIsIntruder] = useState(false);

  const toggleVoice = async (enabled: boolean) => {
    try {
      const cmd = enabled ? 'VOICE_ON' : 'VOICE_OFF';
      await axios.post('http://192.168.0.5:5000/api/robot/command', { command: cmd });
      setIsVoiceOn(enabled);
    } catch (err) {
      console.error("음성인식 제어 실패", err);
    }
  };

  const toggleDetection = async (enabled: boolean) => {
  try {
    const cmd = enabled ? 'DETECTION_ON' : 'DETECTION_OFF';
    await axios.post('http://192.168.0.5:5000/api/robot/command', { command: cmd });
    setisDetectionOn(enabled);
  } catch (err) {
    console.error("감지 제어 실패", err);
  }
};

  const takePanorama = async () => {
    try{
      console.log("파노라마 촬영 명령 전송");
      await axios.post('http://192.168.0.5:5000/api/robot/command', { command: 'PANORAMA' });
    } catch(err){
      console.error("파노라마 명령 전송 실패:", err);
    }
  }

  // 위치 찾기 
  const getSectionName = (x: number, y: number): string => {
    if (connection === 'Offline') return '--';
    if (!routePoints || routePoints.length === 0) return '경로 미설정';

    let minDistance = Infinity;
    let closestLabel = '이동 중'; // 가장 가까운 지점과도 거리가 멀 때

    routePoints.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );

      if (distance < minDistance && distance < 2.0) {
        minDistance = distance;
        
        closestLabel = point.label ? point.label : '도착';
      }
    });

    return closestLabel;
  };

  const refreshLogs = async (): Promise<LogEntry[]> => {
    try {
      const logsResponse = await axios.get(`http://192.168.0.5:5000/api/logs?t=${new Date().getTime()}`);
      setLogs(logsResponse.data);
      return logsResponse.data;
    } catch (err) {
      console.error("로그 업데이트 실패:", err);
      return [];
    }
  };

  useEffect(() => {

    const fetchSavedRoutes = async () => {
      try {
        const wpRes = await axios.get('http://192.168.0.5:5000/api/map/waypoints');
        if (wpRes.data && wpRes.data.length > 0) {
          setRoutePoints(wpRes.data.map((p: any) => ({ x: p.x, y: p.y, label: p.label })));
        }
      } catch (e) {
        console.error("이전 경로 로드 실패", e);
      }
    };
    fetchSavedRoutes();


    const fetchRobotData = async () => {
      try {
        const response = await axios.get(`http://192.168.0.5:5000/api/robot/status?t=${new Date().getTime()}`);
        const { battery, drive_status, connection: conn, isCharging: charging, x, y, theta, isDetectionRunning: running, isVoiceRunning: voiceRunning, planned_path, isFire, isPerson, isIntruder } = response.data;

        setBattery(battery);
        setDriveStatus(drive_status);
        setConnection(conn);
        setIsCharging(charging || false);
        setisDetectionRunning(running || false);
        setisVoiceRunning(voiceRunning || false);
        setIsFire(isFire);
        setIsPerson(isPerson);
        setIsIntruder(isIntruder);
        
        if (planned_path) {
          setPlannedPath(planned_path);
        } else {
          setPlannedPath([]); // 없으면 빈 배열로 초기화
        }

        // x,y 값이 같이 있을때, 객체로 묶어서 저장 
        if (x !== undefined && y !== undefined) {
          setPosition({ x, y, theta: theta || 0 }); 
        }

        await refreshLogs();
      } catch (err) {
        console.error("로봇 상태를 가져오는 데 실패했습니다.");
        setConnection('Offline');
        setBattery(0);
        setDriveStatus('IDLE');
      }
    };

    fetchRobotData();
    const interval = setInterval(fetchRobotData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isCharging) {
      setMode('stopped');
    }
  }, [isCharging]);

  const getMappedStatus = (): RobotStatus => {
    if (connection === 'Offline') {
      return 'stopped';
    }
    
    if (mode === 'manual') {
      return 'manual';
    }
    
    if (isCharging === true || driveStatus === '충전 중' || driveStatus === 'CHARGING' || isCharging){ 
      return 'charging';
    }

    const movingStatuses = ['주행 중', 'PATROLLING', 'once', 'loop', 'RUNNING'];
    if (movingStatuses.includes(driveStatus)) {
      return 'running'; 
    }
    
    switch (driveStatus) {
      case '주행 중':
      case 'PATROLLING': 
        return 'running'; 

      case '수동': 
      case 'MANUAL':     
        return 'manual'; 

      case'정지':
      case 'STOPPED':    
        return 'stopped';
      
      case '대기':
      case 'IDLE':
        return 'idle';

      default:          
       return 'idle';
    }
  };
  
  //// 주행 명령 
  const startRobot = async () => {
    try {
      // autoMode가 'once'면 'once', 'loop'면 'loop' 단어 결정
      const cmd = autoMode; 
      
      console.log(` Flask 명령어: ${cmd}`);
      
      await axios.post('http://192.168.0.5:5000/api/robot/command', { 
        command: cmd 
      });
    } catch (err) {
      console.error("명령 전송 실패", err);
    }
  };

  const stopRobot = async () => {
    try {
      await axios.post('http://192.168.0.5:5000/api/robot/command', { 
        command: 'stop' 
      });
    } catch (err) {
      console.error("정지 실패", err);
    }
  };


  const addLog = (entry: Omit<LogEntry, 'id'>) => {
    const newLog: LogEntry = { ...entry, id: Date.now().toString() };
    setLogs(prev => [newLog, ...prev]);
  };
 
  const stopCharging = async () => {
    try {
      await axios.post('http://192.168.0.5:5000/api/robot/command', { command: 'set_idle' });
      setMode('stopped');
    } catch (err) {
      console.error("명령 전송 실패:", err);
    }
  };

  const startCharging = async () => {
    try {
      await axios.post('http://192.168.0.5:5000/api/robot/command', { command: 'go_to_charging_zone' });
    } catch (err) {
      console.error("이동 명령 전송 실패:", err);
    }
  };

  return (
    <RobotContext.Provider
      value={{
        isFire,
        isPerson,
        isIntruder,
        isDetectionRunning,
        isDetectionOn,
        isVoiceOn,
        isVoiceRunning,
        toggleVoice,
        toggleDetection,
        status: getMappedStatus(),
        mode,
        battery,
        isCharging,
        connection,
        position,
        logs,
        refreshLogs,
        autoMode,
        routePoints,
        location: getSectionName(position.x, position.y),
        plannedPath,
        takePanorama,
        setMode,
        setAutoMode,
        setRoutePoints,
        startRobot,
        stopRobot,
        stopCharging,
        startCharging,
        addLog
      }}
    >
      {children}
    </RobotContext.Provider>
  );
}

export function useRobot() {
  const context = useContext(RobotContext);
  if (context === undefined) {
    throw new Error('useRobot must be used within a RobotProvider');
  }
  return context;
}