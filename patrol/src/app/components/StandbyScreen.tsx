import { useNavigate } from 'react-router';
import { useRobot } from '../contexts/RobotContext';
import { StatusBar } from './StatusBar';
import { Home, Battery, Sparkles } from 'lucide-react';

export function StandbyScreen() {
  const navigate = useNavigate();
  const { startCharging } = useRobot();

  const handleCharge = () => {
    startCharging();
    navigate('/charging');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <StatusBar />
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 mb-8 border border-white/50">
            <div className="relative inline-block mb-6">
              <div className="size-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <Home className="size-16 text-white" strokeWidth={2} />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="size-10 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              대기 중
            </h1>
            <p className="text-slate-600 text-xl mb-10">
              로봇이 대기 상태입니다. 작업을 시작하세요.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/main')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-3"
              >
                <Home className="size-6" />
                메인 화면 이동
              </button>
              
              <button
                onClick={handleCharge}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-3"
              >
                <Battery className="size-6" />
                충전
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}