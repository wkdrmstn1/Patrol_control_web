import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. 서버 응답 데이터에 맞춘 User 인터페이스 수정
interface User {
  userId: string;
  employeeId: string;
}

interface AuthContextType {
  user: User | null;
  // 서버가 이미 검증을 끝냈으므로, 여기서는 유저 객체를 받아 상태만 변경합니다.
  login: (userData: User) => void; 
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 2. 앱 실행 시 로컬 스토리지에서 기존 로그인 정보 불러오기
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // 3. Flask 서버 로그인 성공 후 호출될 함수
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  // 4. 로그아웃 함수
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}