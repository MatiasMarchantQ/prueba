import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import ReCaptchaWrapper from './components/ReCaptchaWrapper';

import LoginPage from './modules/login/pages/LoginPage';
import ForgotPasswordPage from './modules/login/pages/ForgotPasswordPage';
import ChangePasswordPage from './modules/login/pages/ChangePasswordPage';
import ResetPasswordPage from './modules/login/pages/ResetPasswordPage';
import DashboardPage from './modules/dashboard/pages/DashboardPage';


function App() {
  return (
    <Router>
      <UserProvider>
      <ReCaptchaWrapper>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
          <Route path="/changepassword/:token" element={<ChangePasswordPage />} />
          <Route path="/resetpassword/:token" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Redirige cualquier ruta no encontrada al LoginPage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ReCaptchaWrapper>
      </UserProvider>
    </Router>
  );
}

export default App;
