import { useNavigate } from 'react-router';
import { useRobot } from '../contexts/RobotContext';
import { Battery, CheckCircle } from 'lucide-react';

export function ChargingScreen() {
  const navigate = useNavigate();
  const { battery, stopCharging } = useRobot();

  const handleComplete = () => {
    stopCharging();
    navigate('/main');
  };

  const getBatteryColor = () => {
    if (battery > 80) return 'from-green-400 to-emerald-500';
    if (battery > 50) return 'from-yellow-400 to-orange-500';
    return 'from-orange-400 to-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center border border-white/20">
        <div className="mb-8">
          <div className="relative inline-block">
            <div className={`size-40 bg-gradient-to-br ${getBatteryColor()} rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${battery === 100 ? 'animate-pulse' : ''}`}>
              <Battery className="size-20 text-white" strokeWidth={2} />
            </div>
            {battery < 100 && (
              <div className="absolute inset-0 size-40 rounded-full border-4 border-white/30 animate-ping" />
            )}
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            {battery === 100 ? '충전 완료' : '충전 중...'}
          </h1>
          
          <div className="mb-8 mt-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className={`text-7xl font-bold bg-gradient-to-r ${getBatteryColor()} bg-clip-text text-transparent`}>
                {battery}%
              </span>
            </div>
            
            <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden shadow-inner">
              <div
                className={`bg-gradient-to-r ${getBatteryColor()} h-full transition-all duration-1000 ease-out rounded-full shadow-lg`}
                style={{ width: `${battery}%` }}
              />
            </div>
          </div>

          {battery === 100 && (
            <div className="flex items-center justify-center gap-2 text-green-600 mb-6 animate-bounce">
              <CheckCircle className="size-7" />
              <span className="text-lg font-semibold">배터리가 완전히 충전되었습니다</span>
            </div>
          )}
        </div>

        <button
          onClick={handleComplete}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-5 rounded-2xl font-semibold text-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
        >
          완료
        </button>
      </div>
    </div>
  );
}