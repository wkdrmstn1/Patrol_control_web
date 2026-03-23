import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useRobot } from '../contexts/RobotContext';
import { StatusBar } from './StatusBar';
import axios from 'axios'; 
import { 
  Play, 
  Square, 
  History, 
  Gamepad2, 
  Camera,
  MapPin,
  Navigation,
  Home,
  Zap,
  AlertTriangle 
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { LogHistoryModal } from './LogHistoryModal';
import { RouteSettingModal } from './RouteSettingModal';


export function MainScreen() {
  const navigate = useNavigate();
  const {  
    status,
    mode, 
    autoMode, 
    setMode, 
    setAutoMode,
    startRobot, 
    stopRobot,
    refreshLogs,
    isDetectionOn,
    position,
    toggleDetection,
    plannedPath,
    isVoiceOn,
    toggleVoice
  } = useRobot();
  
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [showRouteSettings, setShowRouteSettings] = useState(false);
  const [isPanoramaMode, setIsPanoramaMode] = useState(false);
  const [showDetectionConfirm, setShowDetectionConfirm] = useState(false); 
  const [showVoiceConfirm, setShowVoiceConfirm] = useState(false);
  const [mapMeta, setMapMeta] = useState({ resolution: 0.05, origin_x: 0, origin_y: 0, width: 0, height: 0 });

  const isCharging = status === 'charging';

  // 맵 불러오기 (초기 1회)
  useEffect(() => {
    axios.get('http://192.168.0.5:5000/api/map/meta')
      .then(res => {
        setMapMeta(res.data);
        console.log("📍 맵 메타데이터 로드 완료:", res.data);
      })
      .catch(err => console.error("맵 정보 로드 실패:", err));
  }, []);

  // 90도 회전된 지도 전용 마커 위치 계산
  const getRobotPixelPos = () => {
    if (mapMeta.width === 0) return { left: '50%', bottom: '50%', opacity: 0 };
    
    const xPx = (position.x - mapMeta.origin_x) / mapMeta.resolution;
    const yPx = (position.y - mapMeta.origin_y) / mapMeta.resolution;

    return {
      // 90도 회전 대응 
      left: `${(1 - (yPx / mapMeta.width)) * 100}%`,
      bottom: `${(xPx / mapMeta.height) * 100}%`,
    };
  };

  // 90도 회전된 지도 전용 경로(선) 계산
  const getPathCoords = (x: number, y: number) => {
    if (mapMeta.width === 0) return { xPct: 50, yPct: 50 };
    
    const xPx = (x - mapMeta.origin_x) / mapMeta.resolution;
    const yPx = (y - mapMeta.origin_y) / mapMeta.resolution;

    return {
      xPct: (1 - (yPx / mapMeta.width)) * 100,
      yPct: 100 - (xPx / mapMeta.height) * 100, // SVG Y축 반전 대응
    };
  };

  const rotationDeg = position.theta ? -(position.theta * 180) / Math.PI : 0;

  const handleVoiceToggleClick = () => {
    setShowVoiceConfirm(true);
  };

  const confirmVoiceToggle = async () => {
    await toggleVoice(!isVoiceOn);
    setShowVoiceConfirm(false);
  };

  const handleDetectionToggleClick = () => {
    setShowDetectionConfirm(true);
  };

  const confirmDetectionToggle = async () => {
    await toggleDetection(!isDetectionOn);
    setShowDetectionConfirm(false);
  };

  const handleAutoToggle = () => {
    if (mode === 'auto') {
      setMode('stopped'); 
    } else {
      setMode('auto');
    }
  };

  const handleManual = () => {
    setMode('manual');
    navigate('/manual');
  };

  const handleStart = async () => {
    startRobot();
  };

  const handleStop = async () => {
    stopRobot();
  };

  const handlePanorama = async () => {
    try {
      setIsPanoramaMode(true);

      const currentLogs = await refreshLogs();
      const lastId = currentLogs.length > 0 ? currentLogs[0].id : '0';

      await axios.post('http://192.168.0.5:5000/api/robot/command', { 
        command: 'PANORAMA' 
      });

      navigate('/panorama', { state: { lastId } });
      
    } catch (err) {
      console.error("파노라마 명령 전송 실패:", err);
      alert("로봇과 통신 중 오류가 발생했습니다.");
      setIsPanoramaMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <StatusBar />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Camera className="size-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-slate-800">실시간 카메라</h2>
              </div>
              <div className="relative aspect-[5/4] bg-slate-900 rounded-xl overflow-hidden shadow-lg">
                <ImageWithFallback
                  src="http://192.168.0.5:5000/api/video_feed"
                  alt="Robot Camera Feed"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 지도 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="size-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-slate-800">실시간 지도</h2>
              </div>
              <div className="relative aspect-[5/4] bg-white rounded-xl overflow-hidden shadow-inner border-2 border-slate-200">

                {/* 배경 지도 */}
                <ImageWithFallback
                  src="http://192.168.0.5:5000/map/current_map.jpg" 
                  alt="Real-time Map View"
                  className="w-full h-full object-fill opacity-90" 
                />

                {/* 경로(planned_path) */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  {plannedPath && plannedPath.length > 1 && (
                    <polyline
                      points={plannedPath
                        .map((p: any) => {
                          const { xPct, yPct } = getPathCoords(p.x, p.y);
                          return `${xPct},${yPct}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#3b82f6"     
                      strokeWidth="0.8"    
                      strokeDasharray="2,2" 
                      className="animate-pulse"
                    />
                  )}
                </svg>


                {/* 로봇 아이콘*/}
                <div 
                  className="absolute transition-all duration-500 ease-linear pointer-events-none"
                  style={{
                    left: getRobotPixelPos().left,
                    bottom: getRobotPixelPos().bottom,
                    transform: 'translate(-50%, 50%)' // 아이콘 중심 보정
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <Navigation className="size-6 text-blue-600 fill-blue-600 drop-shadow-md " />
                    <span className="absolute size-8 bg-blue-400 rounded-full animate-ping opacity-30"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-slate-800">제어 패널</h2>
              <div className="flex items-center gap-4">
                
                {/* 음성 인식 스위치 */}
                <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100">
                  <span className={`text-xs font-bold transition-colors ${isVoiceOn ? 'text-emerald-600' : 'text-slate-400'}`}>
                    음성 인식 {isVoiceOn ? 'ON' : 'OFF'}
                  </span>
                  <button
                    onClick={handleVoiceToggleClick} 
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner
                      ${isVoiceOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300
                        ${isVoiceOn ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                {/* 객체 감지 스위치 */}
                <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100">
                  <span className={`text-xs font-bold transition-colors ${isDetectionOn ? 'text-emerald-600' : 'text-slate-400'}`}>
                    객체 감지 {isDetectionOn ? 'ON' : 'OFF'}
                  </span>
                  <button
                    onClick={handleDetectionToggleClick}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner
                      ${isDetectionOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300
                        ${isDetectionOn ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
                
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Auto Mode 스위치 */}
              <div className="space-y-2">
                <button
                  onClick={handleAutoToggle}
                  disabled={isCharging}
                  className={`w-full px-4 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${mode === 'auto'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300'
                    }`}
                >
                  <Zap className="size-5 mx-auto mb-1" />
                  자동
                </button>
                {mode === 'auto' && !isCharging && (
                  <select
                    value={autoMode}
                    onChange={(e) => setAutoMode(e.target.value as 'once' | 'loop')}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="once">1회</option>
                    <option value="loop">무한반복</option>
                  </select>
                )}
              </div>

              <button
                onClick={handleManual}
                disabled={isCharging}
                className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 px-4 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg 
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:from-slate-200 hover:to-slate-300 hover:shadow-xl hover:scale-105"
              >
                <Gamepad2 className="size-5 mx-auto mb-1" />
                수동
              </button>

              <button
                onClick={handleStop}
                className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Square className="size-5 mx-auto mb-1" />
                정지
              </button>

              <button
                onClick={handleStart}
                disabled={mode === 'stopped' || isCharging}
                className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg 
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:shadow-xl hover:scale-105"
              >
                <Play className="size-5 mx-auto mb-1" />
                시작
              </button>

              <button
                onClick={() => setShowLogHistory(true)}
                className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <History className="size-5 mx-auto mb-1" />
                로그
              </button>

              <button
                onClick={handlePanorama}
                disabled={isPanoramaMode || isCharging}
                className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg 
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:shadow-xl hover:scale-105"
              >
                <Camera className="size-5 mx-auto mb-1" />
                {isPanoramaMode ? '촬영중' : '파노라마'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => setShowRouteSettings(true)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg 
                flex items-center justify-center gap-2"
              >
                <Navigation className="size-5" />
                경로 지정
              </button>

              <button
                onClick={() => navigate('/standby')}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                <Home className="size-5" />
                대기 화면 이동
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 객체 감지 상태 */}
      {showDetectionConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className={`size-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-lg ${isDetectionOn ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <AlertTriangle className="size-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">기능 상태 변경</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              객체 감지 기능을 <b>{isDetectionOn ? '비활성화' : '활성화'}</b> 하시겠습니까?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDetectionConfirm(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={confirmDetectionToggle} className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isDetectionOn ? 'bg-red-500' : 'bg-green-500'}`}>변경하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 음성 인식 상태 */}
      {showVoiceConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className={`size-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-lg ${isVoiceOn ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertTriangle className="size-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">음성 인식 상태 변경</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              음성 인식 기능을 <b>{isVoiceOn ? '비활성화' : '활성화'}</b> 하시겠습니까?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowVoiceConfirm(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={confirmVoiceToggle} className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isVoiceOn ? 'bg-red-500' : 'bg-emerald-500'}`}>변경하기</button>
            </div>
          </div>
        </div>
      )}

      {showLogHistory && <LogHistoryModal onClose={() => setShowLogHistory(false)} />}
      {showRouteSettings && <RouteSettingModal onClose={() => setShowRouteSettings(false)} />}
    </div>
  );
}