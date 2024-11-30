import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import {jwtDecode} from 'jwt-decode';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './Login.css';

import withRecaptcha from '../../../HOC/withRecaptcha';


const LoginPage = ({ onSubmitWithRecaptcha }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setToken } = useContext(UserContext);
  const navigate = useNavigate();

  // Este effect es para manejar el token almacenado
  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedLocalToken = localStorage.getItem('token');
    const storedExpiresAt = localStorage.getItem('expiresAt');
  
    const processToken = (token) => {
      const decodedToken = jwtDecode(token);
  
      // Verificar si la cuenta está suspendida
      if (decodedToken.status === 0) {
        setError('Su cuenta se encuentra suspendida. Comuníquese con un administrador para obtener más información.');
        return;
      }
  
      // Verificar si debe cambiar contraseña
      if (decodedToken.must_change_password === 1) {
        navigate(`/changepassword/${token}`);
      } else {
        setToken(token);
        navigate('/dashboard');
      }
    };
  
    if (storedLocalToken && storedExpiresAt) {
      if (storedExpiresAt < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
      } else {
        processToken(storedLocalToken);
      }
    } else if (storedToken) {
      processToken(storedToken);
    }
  }, [navigate, setToken]);

  // Limpiar token al cerrar la pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!rememberMe) {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [rememberMe]);

  const handleLogin = async (event) => {
    event.preventDefault();
    const submitLogin = async (event, recaptchaToken) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password, 
            rememberMe,
            recaptchaToken // Añade el token de reCAPTCHA
          }),
        });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message);
      } else if (data.message === 'Login exitoso' && data.token) {
        const decodedToken = jwtDecode(data.token);
  
        // Verificar el estado de la cuenta
        if (decodedToken.status === 0) {
          setError('Su cuenta se encuentra suspendida. Comuníquese con un administrador para obtener más información.');
          return;
        }
  
        // Verificar si debe cambiar contraseña
        if (decodedToken.must_change_password === 1) {
          navigate(`/changepassword/${data.token}`);
        } else {
          // Si todo está bien, guardar el token en el contexto y redirigir al dashboard
          setToken(data.token);
  
          if (rememberMe) {
            const expiresAt = decodedToken.exp * 1000; // 7 días
            localStorage.setItem('token', data.token);
            localStorage.setItem('expiresAt', expiresAt);
          } else {
            sessionStorage.setItem('token', data.token);
          }
  
          navigate('/dashboard');
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Usa onSubmitWithRecaptcha para manejar el envío
  await onSubmitWithRecaptcha(event, submitLogin);
};
  

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin(event);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = () => {
    setError(null);
  };

  return (
    <div className="login-page">
      <Header />
      <div className="login-container">
        <div className="left-section">
          <img src="images/Imagen-Ventas-2.png" alt="Ingbell" />
        </div>
        <div className="right-section">
          <div className="login-box">
            <h2>Inicio de sesión</h2>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  handleInputChange();
                }}
                onKeyPress={handleKeyPress}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input">
                {showPassword ? (
                  <input
                    type="text"
                    id="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      handleInputChange();
                    }}
                    onKeyPress={handleKeyPress}
                    required
                  />
                ) : (
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      handleInputChange();
                    }}
                    onKeyPress={handleKeyPress}
                    required
                  />
                )}
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} onClick={toggleShowPassword} />
              </div>
            </div>
            <div className="actions">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />{' '}
                Recuérdame
              </label>
              <Link to="/forgotpassword" className="link-button">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <button className="submit-button" onClick={handleLogin}>Iniciar sesión</button>
            {error && (
              <p style={{ color: 'white', fontSize: '0.8rem' }}>
                <FontAwesomeIcon icon={faExclamationCircle} /> {error}
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default withRecaptcha(LoginPage, 'login_action');
