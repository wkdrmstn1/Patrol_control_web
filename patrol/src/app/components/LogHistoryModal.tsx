/* loghistorymodal */

import { useState } from 'react';
import { useRobot } from '../contexts/RobotContext';
import { X, Eye, History, Trash2, CheckSquare, Square } from 'lucide-react';
import { ImageModal } from './ImageModal';
import axios from 'axios';

interface LogHistoryModalProps {
  onClose: () => void;
}

export function LogHistoryModal({ onClose }: LogHistoryModalProps) {
  // context에서 필요한 데이터와 함수를 가져옵니다.
  const { logs, refreshLogs } = useRobot();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 현재 로그인된 사용자가 관리자인지 확인 (localStorage 기준)
  const loggedInUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = loggedInUser.employee_id === 'admin';

  // 전체 선택/해제 토글
  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map(log => log.id));
    }
  };

  // 개별 선택 토글
  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 선택 삭제 실행
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.length}개의 로그를 영구 삭제하시겠습니까?`)) return;

    try {
      // 병렬로 삭제 요청 전송
      await Promise.all(
        selectedIds.map(id => axios.delete(`http://192.168.0.24:5000/api/logs/${id}`))
      );
      
      setSelectedIds([]); // 선택 초기화
      await refreshLogs(); // 목록 새로고침
      alert("선택한 로그가 삭제되었습니다.");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 로그 삭제 처리 함수
  const handleDelete = async (logId: string) => {
    if (!window.confirm("이 로그를 영구적으로 삭제하시겠습니까?")) return;

    try {
      // 서버 IP 주소는 192.168.0.24 로 통일 (본인 환경에 맞게 수정)
      await axios.delete(`http://192.168.0.24:5000/api/logs/${logId}`);
      
      // 삭제 후 Context의 로그 목록을 최신화합니다.
      await refreshLogs();
      alert("로그가 삭제되었습니다.");    
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <History className="size-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">시스템 로그 내역</h2>
                <p className="text-slate-500 text-sm font-medium">로봇의 모든 주행 기록 및 특이사항을 확인합니다.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:rotate-90"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="px-10 py-4 bg-white border-b border-slate-50 flex items-center h-16">
            {isAdmin && selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all animate-in fade-in slide-in-from-left duration-200"
              >
                <Trash2 className="size-4" />
                {selectedIds.length}개 선택 삭제
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-8 bg-white font-['Pretendard']">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                  <th className="px-6 py-2 w-10 text-center">
                    <button onClick={toggleSelectAll} className="transition-colors">
                      {selectedIds.length === logs.length && logs.length > 0 
                        ? <CheckSquare className="size-6 text-indigo-600" /> 
                        : <Square className="size-6 text-slate-300" />}
                    </button>
                  </th>
                  <th className="px-6 py-2">기록 시간</th>
                  <th className="px-6 py-2">상황 카테고리</th>
                  <th className="px-6 py-2">발생 위치</th>
                  <th className="px-6 py-2 text-center">동작</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => {
                    console.log("실제 로그 데이터 구조:", log);
                    const isFire = log.situation.includes('화재');
                    const isIntruder = log.situation.includes('침입자');
                    const isTheft = log.situation.includes('도난');
                    const isPano = log.situation.includes('파노라마');
                    const isSelected = selectedIds.includes(log.id);

                    return (
                      <tr key={log.id} className={`group transition-all duration-200 ${isSelected ? 'bg-indigo-50/50' : isPano ? 'bg-orange-50/50' : (isFire || isIntruder || isTheft) ? 'bg-red-50/50' : 'hover:bg-slate-50/80'}`}>
                        <td className="px-6 py-5 text-center">
                          <button onClick={() => toggleSelectOne(log.id)} className="transition-colors">
                            {isSelected 
                              ? <CheckSquare className="size-6 text-indigo-600" /> 
                              : <Square className="size-6 text-slate-200 group-hover:text-slate-300" />}
                          </button>
                        </td>

                        {/* 시간 */}
                        <td className="px-6 py-5 text-sm text-slate-500 font-bold font-mono">
                          {log.time}
                        </td>

                        {/* 상황 */}
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border-2 shadow-sm transition-all ${
                            (isFire || isTheft) 
                              ? 'border-red-600 bg-red-600 text-white' 
                            : isIntruder 
                              ? 'border-rose-700 bg-rose-700 text-white' 
                            : isPano 
                              ? 'border-orange-500 bg-white text-orange-600' 
                            : 'border-slate-200 bg-slate-100 text-slate-500' 
                          }`}>
                            {isPano ? '📸 파노라마 촬영' : log.situation}
                          </span>
                        </td>

                        {/* 위치 */}
                        <td className="px-6 py-5 text-sm text-slate-700 font-bold italic tracking-wide">
                          {log.position === 'S' ? 'START' : log.position}
                        </td>

                        {/* 이미지 보기 / 삭제 */}
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-3">
                      
                            {log.imageUrl && log.imageUrl.length > 0 ? (
                              <button
                                onClick={() => setSelectedImage(log.imageUrl)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 text-white ${
                                  (isFire || isTheft) ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                                  : isIntruder ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-100'
                                  : isPano ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
                                  : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200' 
                                }`}
                              >
                                <Eye className="size-4" />
                                이미지 보기
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs font-bold">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold">
                      저장된 로그 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black text-xl shadow-xl transition-all active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {selectedImage && (
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </>
  );
}