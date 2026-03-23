import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StatusBar } from './StatusBar';
import { Home, Keyboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, StopCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useRobot } from '../contexts/RobotContext';

export function ManualScreen() {
  const navigate = useNavigate();
  const { setMode } = useRobot();
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeKeyRef = useRef<string | null>(null); 

  const sendCommand = async (action: string) => {
    try {
      await axios.post('http://192.168.0.5:5000/api/robot/manual', { action });
    } catch (err) {
      console.error("명령 전송 실패", err);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return; 
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
    }
    
    // 이미 누른 키가 있다면 중복 처리 방지
    if (activeKeyRef.current !== null) return;

    const lowerKey = e.key.toLowerCase();
    activeKeyRef.current = lowerKey; // Ref에 현재 누른 키 등록

    switch (lowerKey) {
      case 'w': setActiveKey('up'); sendCommand('FORWARD'); break;
      case 's': setActiveKey('down'); sendCommand('BACKWARD'); break;
      case 'a': setActiveKey('left'); sendCommand('LEFT'); break;
      case 'd': setActiveKey('right'); sendCommand('RIGHT'); break;
      case ' ': setActiveKey('stop'); sendCommand('STOP'); break;
    }
  }, []); // 의존성 배열 비움 (Ref 사용으로 함수 고정)

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const lowerKey = e.key.toLowerCase();
    
    // 내가 누른 키를 뗄 때만 실행 (Ref 사용으로 activeKey 의존성 제거)
    if (activeKeyRef.current === lowerKey) {
      activeKeyRef.current = null; 
      sendCommand('STOP');
    }
  }, []); // 의존성 배열 비움 (함수가 새로 생성되지 않음)

  const handleExit = async () => {
    await sendCommand('STOP');
    setMode('stopped');
    navigate('/main');
  };

  useEffect(() => {
    setMode('manual'); 
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (activeKeyRef.current) {
        sendCommand('STOP');
      }
      setMode('stopped');
    };
  }, [handleKeyDown, handleKeyUp, setMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <StatusBar />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* 카메라 화면 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="size-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Keyboard className="size-5 text-white" />
                </div>
                <h2 className="font-bold text-lg text-slate-800">수동 조작 모드</h2>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg">
                MANUAL
              </div>
            </div>
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-lg">
              <ImageWithFallback
                src="http://192.168.0.5:5000/api/video_feed"
                alt="Manual Control Camera Feed"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowKeyboard(!showKeyboard)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3"
            >
              <Keyboard className="size-6" />
              키보드 패널 {showKeyboard ? '숨기기' : '열기'}
            </button>

            {/* 메인 화면 이동 버튼 */}
            <button
              onClick={handleExit}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3"
            >
              <Home className="size-6" />
              메인 화면 이동
            </button>
          </div>

          {/* 키보드 패널 (WASD) */}
          {showKeyboard && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/50">
              <h3 className="font-bold text-xl mb-8 text-center text-slate-800">키보드 조작 (WASD | SPACE)</h3>
              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-3 gap-4">
                  <div />
                  <button className={`p-8 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shadow-lg gap-2 ${activeKey === 'up' ? 'bg-blue-700 scale-95 ring-4 ring-blue-300' : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-110 text-white'}`}>
                    <ArrowUp className="size-8" strokeWidth={3} />
                    <span className="text-sm font-bold opacity-80">W</span>
                  </button>
                  <div />
                  
                  <button className={`p-8 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shadow-lg gap-2 ${activeKey === 'left' ? 'bg-blue-700 scale-95 ring-4 ring-blue-300' : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-110 text-white'}`}>
                    <ArrowLeft className="size-8" strokeWidth={3} />
                    <span className="text-sm font-bold opacity-80">A</span>
                  </button>
                  
                  <div className={`rounded-2xl flex flex-col items-center justify-center font-bold text-lg shadow-inner transition-colors gap-1 ${activeKey === 'stop' ? 'bg-red-200 text-red-700 border-2 border-red-400' : 'bg-slate-200 text-slate-700'}`}>
                    <StopCircle className="size-8" />
                    <span className="text-xs">SPACE</span>
                  </div>
                  
                  <button className={`p-8 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shadow-lg gap-2 ${activeKey === 'right' ? 'bg-blue-700 scale-95 ring-4 ring-blue-300' : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-110 text-white'}`}>
                    <ArrowRight className="size-8" strokeWidth={3} />
                    <span className="text-sm font-bold opacity-80">D</span>
                  </button>
                  
                  <div />
                  <button className={`p-8 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shadow-lg gap-2 ${activeKey === 'down' ? 'bg-blue-700 scale-95 ring-4 ring-blue-300' : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-110 text-white'}`}>
                    <ArrowDown className="size-8" strokeWidth={3} />
                    <span className="text-sm font-bold opacity-80">S</span>
                  </button>
                  <div />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}