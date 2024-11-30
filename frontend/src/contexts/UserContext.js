import React, { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const UserContext = createContext();

const publicRoutes = ['/', '/forgotpassword', '/changepassword', '/resetpassword'];

const decryptToken = (token) => {
  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodificar el token
    return decodedToken;
  } catch (error) {
    console.error('Error al descifrar el token:', error);
    return null;
  }
};

const isTokenExpired = (token) => {
  const decryptedToken = decryptToken(token);
  if (decryptedToken && decryptedToken.exp) {
    return Date.now() >= decryptedToken.exp * 1000;
  }
  return true;
};

const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('expiresAt');
  sessionStorage.removeItem('token');
};

const UserProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || sessionStorage.getItem('token') || null);  // Revisar tanto localStorage como sessionStorage
  const [roleId, setRoleId] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token'); // Buscar token en ambas fuentes
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route)); // Revisar si es una ruta pública

    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      const decryptedToken = decryptToken(storedToken);
      if (decryptedToken) {
        setRoleId(decryptedToken.role_id);
        setUserId(decryptedToken.user_id);
      }
      
      // Monitorear la expiración del token
      const expirationTime = decryptedToken.exp * 1000 - Date.now();
      const warningTime = 5 * 60 * 1000; // 5 minutos antes de que expire

      if (expirationTime > 0) {
        const timer = setTimeout(() => {
          alert('Tu sesión ha expirado. Haz clic en "Aceptar" para ser redirigido.');
          console.clear();
          clearToken();
          setToken(null);
          setRoleId(null);
          setUserId(null);
          navigate('/');
        }, expirationTime);

        return () => clearTimeout(timer);
      }

      // Si el tiempo de advertencia se ha pasado
      if (expirationTime < warningTime && expirationTime > 0) {
        alert('Tu sesión expira pronto. Por favor guarda tu trabajo.');
      }

    } else {
      // Si el token no es válido o ha expirado
      clearToken();
      setToken(null);
      setRoleId(null);
      setUserId(null);
      if (!isPublicRoute) {
        navigate('/');
      }
    }
  }, [navigate, location]);

  return (
    <UserContext.Provider value={{ token, setToken, roleId, userId }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider, decryptToken };
