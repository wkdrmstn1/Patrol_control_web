import { useState, useEffect, useRef } from 'react';
import { useRobot } from '../contexts/RobotContext';
import { X, MapPin, Home, Navigation, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';
import axios from 'axios';

interface RouteSettingModalProps {
  onClose: () => void;
}

interface Point {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'waypoint';
  section: 'A' | 'B';
}

export function RouteSettingModal({ onClose }: RouteSettingModalProps) {
  const { setRoutePoints } = useRobot();
  const [points, setPoints] = useState<Point[]>([
  ]);
  
  const [mapTick, setMapTick] = useState(Date.now());
  const [mapMeta, setMapMeta] = useState<any>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const [showOrderModal, setShowOrderModal] = useState(false); 

  useEffect(() => {
    const initData = async () => {
      try {
        const metaRes = await axios.get('http://192.168.0.5:5000/api/map/meta');
        const meta = metaRes.data;
        setMapMeta(meta);

        // 맵 정보가 정상일 때 이전 경로 가져와서 픽셀로 역산 복원
        if (meta.width > 0) {
          const wpRes = await axios.get('http://192.168.0.5:5000/api/map/waypoints');
          if (wpRes.data && wpRes.data.length > 0) {
            const loadedPoints = wpRes.data.map((p: any, index: number) => {
              const original_xPx = (p.x - meta.origin_x) / meta.resolution;
              const original_yPx = (p.y - meta.origin_y) / meta.resolution;
              const xPct = (1 - (original_yPx / meta.width)) * 100;
              const yPct = (1 - (original_xPx / meta.height)) * 100;

              return {
                id: Date.now().toString() + index,
                x: xPct,
                y: yPct,
                type: p.type || (index === 0 ? 'start' : 'waypoint'),
                section: p.section || 'A'
              };
            });
            setPoints(loadedPoints);
          }
        }
      } catch (e) {
        console.error("데이터 로드 실패", e);
      }
    };
    initData();

    const interval = setInterval(() => setMapTick(Date.now()), 1500);
    return () => clearInterval(interval);
  }, []);

  const getLabeledPoints = () => {
    let aCount = 1;
    let bCount = 1;
    return points.map(p => {
      if (p.type === 'start') return { ...p, label: 'START' };
      return { ...p, label: p.section === 'A' ? `A-${aCount++}` : `B-${bCount++}` };
    });
  };
  const labeledPoints = getLabeledPoints(); // 렌더링에 사용할 배열

  const movePoint = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= points.length) return;
    const newPoints = [...points];
    const temp = newPoints[index];
    newPoints[index] = newPoints[index + direction];
    newPoints[index + direction] = temp;
    setPoints(newPoints);
  };

  const updatePointSection = (id: string, section: 'A' | 'B') => {
    setPoints(points.map(p => p.id === id ? { ...p, section } : p));
  };


  // 지도 빈 곳 클릭 시
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    if (activeMenuId) { setActiveMenuId(null); return; }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: Point = {
      id: Date.now().toString(),
      x, y,
      section: 'A', // 기본값 A구역
      type: !points.some(p => p.type === 'start') ? 'start' : 'waypoint'
    };
    setPoints([...points, newPoint]);
  };

  // 마커 눌렀을때
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return; // 왼쪽 클릭만 허용
    e.stopPropagation(); 

    setDraggingId(id);
    isDraggingRef.current = false; // 드래그 여부 초기화
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 마커 드래그 
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    
    // 미세한 움직임이 있을 때만 드래그로 판정
    if (Math.abs(e.movementX) > 1 || Math.abs(e.movementY) > 1) {
      isDraggingRef.current = true;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setPoints(points.map(p => p.id === draggingId ? { ...p, x, y } : p));
  };

  // 마커 드래그 종료 
  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      e.stopPropagation();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingId(null);
      
      // 드래그 판정 플래그를 약간 늦게 꺼서 지도의 handleMapClick 발동 방지
      setTimeout(() => { isDraggingRef.current = false; }, 50);
    }
  };

  // 마커 더블 클릭 시 메뉴 토글
  const handleMarkerDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 지도의 클릭 이벤트 방지
    setActiveMenuId(prev => prev === id ? null : id);
  };

  const changePointType = (id: string, newType: 'start' | 'waypoint') => {
    setPoints(points.map(p => {
      if (p.id !== id && p.type === newType && newType !== 'waypoint') {
        return { ...p, type: 'waypoint' };
      }
      if (p.id === id) return { ...p, type: newType };
      return p;
    }));
    setActiveMenuId(null);
  };

  const removePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
    setActiveMenuId(null);
  };

  const handleComplete = async () => {
    if (!mapMeta || mapMeta.width === 0) {
      alert("지도를 로드하는 중입니다. 잠시 후 시도해주세요.");
      return;
    }

    const startPoint = points.find(p => p.type === 'start');
    const waypoints = points.filter(p => p.type === 'waypoint');

    const orderedPoints = [];
    if (startPoint) orderedPoints.push(startPoint);
    orderedPoints.push(...waypoints);

    // 90도 회전 역산 공식 정교화
    const realCoordinates = labeledPoints.map(p => {
      const original_yPx = (1 - (p.x / 100)) * mapMeta.width; 
      const original_xPx = (1 - (p.y / 100)) * mapMeta.height; 
      const realX = mapMeta.origin_x + (original_xPx * mapMeta.resolution);
      const realY = mapMeta.origin_y + (original_yPx * mapMeta.resolution);

      return { 
        type: p.type, 
        section: p.section, 
        label: p.label,     
        x: parseFloat(realX.toFixed(2)), 
        y: parseFloat(realY.toFixed(2)) 
      };
    });

    console.log("📍 로봇 전송 좌표:", realCoordinates);

    try {
      await axios.post('http://192.168.0.5:5000/api/robot/command', {
        command: 'WAYPOINT_NAVIGATION',
        waypoints: realCoordinates
      });

      // 계산된 실제 좌표(realX)를 저장하여 파노라마 오차 제거 
      setRoutePoints(realCoordinates.map(p => ({ x: p.x, y: p.y, label: p.label })));

      alert("경로가 전송되었습니다.");
      onClose();
    } catch (error) {
      alert("서버 전송에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Navigation className="size-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">경로 지정</h2>
          </div>
          <button onClick={onClose} className="size-12 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all">
            <X className="size-6 text-slate-600" />
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <span className="text-slate-700 font-medium text-sm">마커를 <b>드래그</b>하여 이동하고, <b>더블 클릭</b>하여 옵션을 변경하세요.</span>
          <button 
            onClick={() => setShowOrderModal(!showOrderModal)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-indigo-200 text-indigo-700 font-bold shadow-sm hover:bg-indigo-50 transition-colors"
          >
            <Settings2 className="size-4" /> 구역 및 주행 순서 편집
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 overflow-auto p-6">
          <div
            onClick={handleMapClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative w-full aspect-video bg-white rounded-2xl cursor-crosshair overflow-hidden shadow-xl touch-none"
          >
            <img
              src={`http://192.168.0.5:5000/map/current_map.jpg?t=${mapTick}`}
              alt="Map"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              draggable="false"
            />
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {labeledPoints.map((point, index) => { 
                if (index === labeledPoints.length - 1) return null;
                const nextPoint = labeledPoints[index + 1]; 
                return (
                  <line
                    key={`line-${point.id}`}
                    x1={`${point.x}%`} y1={`${point.y}%`}
                    x2={`${nextPoint.x}%`} y2={`${nextPoint.y}%`}
                    stroke="#6366f1" strokeWidth="4" strokeDasharray="8,8"
                  />
                );
              })}
            </svg>

            {labeledPoints.map((point, index) => (
              <div
                key={point.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 
                  ${!draggingId ? 'transition-all duration-200' : ''}
                  ${activeMenuId === point.id ? 'z-50' : draggingId === point.id ? 'z-40' : 'z-20'}
                  ${draggingId === point.id ? 'scale-110' : 'scale-100'}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <div className="relative">
                  <div 
                    onPointerDown={(e) => handlePointerDown(e, point.id)}
                    onDoubleClick={(e) => handleMarkerDoubleClick(e, point.id)}
                    onClick={(e) => e.stopPropagation()} 
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {point.type === 'start' && (
                      <div className="size-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                        <Home className="size-5 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                    {point.type === 'waypoint' && point.section === 'A' && (
                      <div className="size-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                        <MapPin className="size-4 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                    {point.type === 'waypoint' && point.section === 'B' && (
                      <div className="size-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                        <MapPin className="size-4 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {activeMenuId === point.id && (
                    <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-xl text-xs whitespace-nowrap space-y-2 shadow-xl pointer-events-auto z-[100]">
                      <div className="font-semibold text-center border-b border-white/20 pb-1 mb-1">
                        {point.label} 옵션
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); changePointType(point.id, 'start'); }} className="block w-full text-left hover:text-green-300">시작점으로 설정</button>
                      <button onClick={(e) => { e.stopPropagation(); changePointType(point.id, 'waypoint'); }} className="block w-full text-left hover:text-blue-300">경유지로 변경</button>
                      <button onClick={(e) => { e.stopPropagation(); removePoint(point.id); }} className="block w-full text-left text-red-400 hover:text-red-200 pt-1 border-t border-white/20 mt-1">삭제</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-8 justify-center">
            <div className="flex items-center gap-2"><div className="size-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full" /><span className="text-sm font-semibold">시작점</span></div>
            <div className="flex items-center gap-2"><div className="size-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full" /><span className="text-sm font-semibold">A 구역</span></div>
            <div className="flex items-center gap-2"><div className="size-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full" /><span className="text-sm font-semibold">B 구역</span></div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50/50">
          <button onClick={handleComplete} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:scale-105 transition-all">
            경로 전송 및 설정 완료
          </button>
        </div>

        {/* 구역 및 주행 순서 커스텀 팝업창 */}
        {showOrderModal && (
          <div className="absolute top-24 right-10 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-slate-200 z-[150] flex flex-col max-h-[60vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-800">주행 순서 & 구역 편집</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="size-5 text-slate-500"/>
              </button>
            </div>
            <div className="text-xs text-slate-500 mb-3">화살표를 눌러 주행 순서를 섞을 수 있습니다.</div>
            
            <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
              {labeledPoints.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`font-black w-10 text-center text-sm ${p.type === 'start' ? 'text-green-600' : p.section === 'A' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {p.label}
                    </span>
                    {p.type !== 'start' && (
                      <select 
                        value={p.section} 
                        onChange={(e) => updatePointSection(p.id, e.target.value as 'A'|'B')}
                        className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                      </select>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => movePoint(idx, -1)} disabled={idx === 0} className="p-1.5 disabled:opacity-30 hover:bg-slate-200 rounded-lg transition-colors"><ArrowUp className="size-4 text-slate-700"/></button>
                    <button onClick={() => movePoint(idx, 1)} disabled={idx === labeledPoints.length - 1} className="p-1.5 disabled:opacity-30 hover:bg-slate-200 rounded-lg transition-colors"><ArrowDown className="size-4 text-slate-700"/></button>
                  </div>
                </div>
              ))}
              {labeledPoints.length === 0 && <div className="text-center text-sm text-slate-400 py-4">마커를 먼저 추가해주세요.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}