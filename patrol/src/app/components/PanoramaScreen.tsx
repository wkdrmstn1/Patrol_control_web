import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router'; // useLocation 추가
import { CheckCircle, Home, Camera, Loader2 } from 'lucide-react'; // Loader2 추가
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useRobot } from '../contexts/RobotContext'; // useRobot 추가

export function PanoramaScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshLogs } = useRobot();
  const [loading, setLoading] = useState(true);
  const [panoData, setPanoData] = useState<any>(null);
  
  const lastId = location.state?.lastId || '0';

  useEffect(() => {
    const checkInterval = setInterval(async () => {
      const logs = await refreshLogs();
      const latest = logs[0];

      if (latest) {
        const isPanorama = latest.situation.includes("파노라마");

        if (isPanorama && String(latest.id) !== String(lastId)) {
          clearInterval(checkInterval);
          setPanoData(latest);
          setLoading(false);
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [lastId, refreshLogs]);

  // 촬영 중 대기 화면 
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="size-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-3xl font-bold mb-2">파노라마 촬영 중...</h2>
        <p className="text-slate-400">로봇이 이미지를 전송하고 있습니다. 잠시만 기다려주세요.</p>
      </div>
    );
  }

  // 촬영 완료 화면 (시간 위치 포함)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="size-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="size-8" strokeWidth={2} />
                  </div>
                  <h1 className="text-4xl font-bold">파노라마 촬영 완료</h1>
                </div>
              </div>
            </div>

            <div className="relative">
              <ImageWithFallback
                src={panoData?.imageUrl} 
                alt="Panorama View"
                className="w-full h-[500px] object-cover"
              />
            </div>

            <div className="p-8 bg-gradient-to-br from-slate-50 to-white">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-600 mb-2 font-medium">촬영 시간</p>
                  <p className="font-bold text-slate-800">{panoData?.time}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-600 mb-2 font-medium">촬영 위치</p>
                  <p className="font-bold text-slate-800">{panoData?.position}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/main')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3"
              >
                <Home className="size-6" />
                메인 화면으로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}