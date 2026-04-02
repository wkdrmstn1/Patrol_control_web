/* satatusbar */

import { Battery, BatteryCharging, Clock, Activity, MapPin, ShieldCheck } from 'lucide-react';
import { useRobot } from '../contexts/RobotContext';
import { useState, useEffect } from 'react';

export function StatusBar() {
  const {rawDriveStatus, status, battery, isCharging, connection, location: robotLocation, isFire, isPerson, isIntruder, isTheft, isFireDetectionOn, isPersonDetectionOn } = useRobot(); 
  const [time, setTime] = useState(new Date());

  const displayBattery = Math.min(battery, 100);
  
  // 연결 안됨 상태를 판별
  const isOffline = connection === 'Offline' || connection === 'None';

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentTime = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  const getDetectionStatusText = () => {
    if (isFire) return "🔥 화재 발생!";
    if (isIntruder) return "🚨 침입자 감지";
    if (isPerson) return "👤 사람 감지";
    if (!isFireDetectionOn && !isPersonDetectionOn) return "모두 비활성화";
    
    const fireStr = isFireDetectionOn ? "화재: ON" : "화재: OFF";
    const personStr = isPersonDetectionOn ? "사람: ON" : "사람: OFF";
    
    return `${personStr} / ${fireStr}`;
  };


  const getStatusText = () => {
    if (isOffline) return '연결 안됨';
    if (isTheft) return '🚨 도난 감지';

    if (status === 'running') return rawDriveStatus;

    switch (status) {
      case 'idle': return '대기';
      case 'charging': return '충전 중';
      case 'stopped': return '정지';
      case 'manual': return '수동';
      default: return '알 수 없음';
    }
  };

  const getStatusTextColor = () => {
    if (isTheft) return 'text-red-500 animate-bounce';
    if (isOffline) return 'text-red-500';
    if (isCharging || status === 'charging') return 'text-green-400';
    return 'text-white';
  };

  const getDetectionStatusColor = () => {
    if (isOffline) return 'text-red-500'
    if (isFire || isIntruder) return "text-red-500 animate-bounce"; // 위험 상황 강조
    if (isPerson) return "text-orange-500";
    return "text-emerald-500";
  };

  const getBatteryColor = () => {
    if (isOffline) return 'text-red-500';
    if (isCharging) return 'text-green-400';
    if (displayBattery > 50) return 'text-green-400';
    if (displayBattery > 20) return 'text-yellow-400';
    return 'text-red-500';
  };

  const getStatusColor = () => {
    if (isTheft) return 'bg-red-600 animate-pulse';
    if (isOffline) return 'bg-red-500';
    if (isCharging || status === 'charging') return 'bg-green-500';
    
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'manual': return 'bg-purple-500';
      case 'idle':
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 shadow-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          {/* 로봇 상태 */}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
            <Activity className="size-5 text-white" />
            <span className="text-sm text-white font-medium">로봇 상태:</span>
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${getStatusColor()} animate-pulse`} />
              <span className={`font-semibold ${getStatusTextColor()}`}>{getStatusText()}</span>
            </div>
          </div>
          
          {/* 배터리 상태 */}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
            {/* 오프라인이 아닐 때만 충전 애니메이션(bounce) 적용 */}
            {isCharging && !isOffline ? (
              <BatteryCharging className={`size-5 ${getBatteryColor()} animate-bounce`} />
            ) : (
              <Battery className={`size-5 ${getBatteryColor()}`} />
            )}
            <span className={`font-bold ${getBatteryColor()}`}>
              {isOffline ? '-- ' : `${displayBattery}%`}
            </span>
          </div>

          {/* 현재 위치 */}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
            <MapPin className="size-5 text-white" />
            <span className="text-sm text-white font-medium">현재 위치:</span>
            <span className={`font-bold ${isOffline ? 'text-white' : 'text-blue-400'}`}>
              {isOffline ? '-- ' : `${robotLocation}`}
            </span>
          </div>
          
        {/* 객체 감지 상태 */}
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
            <ShieldCheck className="size-5 text-white" />
            <span className="text-sm text-white font-medium">객체 감지상태:</span>
            <span className={`font-bold ${getDetectionStatusColor()}`}>
              {getDetectionStatusText()}
            </span>
          </div>
        </div>

        {/* 시간 표시 */}
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
          <Clock className="size-4 text-white" />
          <span className="text-sm font-medium text-white">{currentTime}</span>
        </div>
      </div>
    </div>
  );
}