import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RobotProvider } from './contexts/RobotContext';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { StandbyScreen } from './components/StandbyScreen';
import { ChargingScreen } from './components/ChargingScreen';
import { MainScreen } from './components/MainScreen';
import { ManualScreen } from './components/ManualScreen';
import { PanoramaScreen } from './components/PanoramaScreen';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route
        path="/standby"
        element={
          <ProtectedRoute>
            <StandbyScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/charging"
        element={
          <ProtectedRoute>
            <ChargingScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/main"
        element={
          <ProtectedRoute>
            <MainScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manual"
        element={
          <ProtectedRoute>
            <ManualScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panorama"
        element={
          <ProtectedRoute>
            <PanoramaScreen />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RobotProvider>
          <AppRoutes />
        </RobotProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
