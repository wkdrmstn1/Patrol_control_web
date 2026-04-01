/* login screen */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios'; 
import { useAuth } from '../contexts/AuthContext';
import { Lock, Bot, CreditCard } from 'lucide-react';

export function LoginScreen() {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Flask 서버로 로그인 요청 전송
      const response = await axios.post('http://192.168.0.24:5000/api/login', {
        userId: username, // 아이디 칸에 입력한 사원증 번호
        password: password
      });

      if (response.status === 200) {
        // 로그인 성공 시 AuthContext에 유저 정보 저장
        setAuthUser(response.data.user);

        // 메인 화면으로 이동
        navigate('/standby');
      }
    } catch (err: any) {
      // 백엔드에서 보낸 에러 메시지 처리 (401: 비번 틀림 등)
      const errorMessage = err.response?.data?.error || '로그인 서버 연결에 실패했습니다.';
      setError(errorMessage);
    }
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="size-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bot className="size-12 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            로봇 제어 시스템
          </h1>
          <p className="text-slate-600">사원증 번호로 로그인하세요</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              사원증 번호 (ID)
            </label>
            <div className="relative group">
              {/* 아이콘을 CreditCard로 변경하여 사원증 느낌 강조 */}
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                placeholder="사원증 번호를 입력하세요"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              비밀번호
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105"
          >
            로그인
          </button>

          <button
            type="button"
            onClick={handleSignup}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 rounded-xl transition-all duration-300 hover:scale-105"
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}