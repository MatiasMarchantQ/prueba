import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './ChangePassword.css';
import withRecaptcha from '../../../HOC/withRecaptcha';

const ForgotPasswordPage = ({ onSubmitWithRecaptcha }) => {
  const [email, setEmail] = useState(() => localStorage.getItem('forgotPasswordEmail') || '');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Modificar el estado inicial de emailSent para incluir verificación de expiración
  const [emailSent, setEmailSent] = useState(() => {
    const saved = localStorage.getItem('emailSent');
    const expiration = localStorage.getItem('emailSentExpiration');
    if (saved && expiration) {
      // Si el tiempo ha expirado, limpiar localStorage y retornar null
      if (new Date().getTime() > parseInt(expiration)) {
        localStorage.removeItem('emailSent');
        localStorage.removeItem('emailSentExpiration');
        localStorage.removeItem('forgotPasswordEmail');
        return null;
      }
      return JSON.parse(saved);
    }
    return null;
  });

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Limpiar localStorage cuando el componente se monta (cuando el usuario entra a la página)
  useEffect(() => {
    // Solo limpiar si no hay un emailSent guardado
    if (!localStorage.getItem('emailSent')) {
      localStorage.removeItem('forgotPasswordEmail');
    }
  }, []);

  // Actualizar localStorage cuando emailSent cambie
  useEffect(() => {
    if (emailSent !== null) {
      localStorage.setItem('emailSent', JSON.stringify(emailSent));
    }
  }, [emailSent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (!email) {
      setError('Por favor, ingrese un correo electrónico');
      setEmailSent(false);
      return;
    }
  
    if (!emailRegex.test(email)) {
      setError('Ingrese un correo electrónico válido');
      setEmailSent(false);
      return;
    }
  
    // Función que será llamada después de verificar el reCAPTCHA
    const submitForgotPassword = async (event, recaptchaToken) => {
      setIsLoading(true);
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/forgot-password`;
      const formData = { 
        email,
        recaptchaToken
      };
    
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
    
        const data = await response.json();
    
        // Verificar primero si es una respuesta 403 (usuario suspendido)
        if (response.status === 403) {
          setError(data.message);
          setEmailSent(false);
          return;
        }
    
        if (!response.ok) {
          throw new Error(data.message || 'Error al enviar el correo electrónico.');
        }
    
        setMessage(data.message);
        setEmailSent(true);
        const expirationTime = new Date().getTime() + (15 * 60 * 1000);
        localStorage.setItem('emailSent', 'true');
        localStorage.setItem('emailSentExpiration', expirationTime.toString());
        localStorage.setItem('forgotPasswordEmail', email);
        setError(null);
      } catch (error) {
        console.error('Error sending email:', error.message);
        setError(error.message || 'No se pudo enviar el correo electrónico. Inténtalo de nuevo más tarde.');
        setEmailSent(false);
      } finally {
        setIsLoading(false);
      }
    };
  
    // Ejecutar el reCAPTCHA y luego el submitForgotPassword
    await onSubmitWithRecaptcha(event, submitForgotPassword);
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
            <h2>¿Olvidaste tu contraseña?</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete='email'
                  required
                  disabled={emailSent === true}
                />
              </div>
              {emailSent === true && (
                <div className="success-notification">
                  <FontAwesomeIcon icon={faCheckCircle} />
                 <span>{message || 'Correo electrónico enviado exitosamente!'}</span>
                </div>
              )}
              {emailSent === false && (
                <div className="error-notification">
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{error}</span>
                </div>
              )}
              {emailSent === null && (
                <div></div>
              )}
              <button
                type="submit"
                className="submit-button"
                disabled={emailSent === true || isLoading}
              >
                {isLoading ? 'Enviando...' : 'Restablecer contraseña'}
              </button>
            </form>
            <p className="back-login">
              <Link to="/" className="link-button" style={{ textAlign: 'center' }}>
                Volver al Inicio
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default withRecaptcha(ForgotPasswordPage, 'forgot_password_action');
