import React, { useState, useEffect  } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import withRecaptcha from '../../../HOC/withRecaptcha';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './ResetPassword.css'

const ResetPasswordPage = ({ onSubmitWithRecaptcha }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState({ password: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [step, setStep] = useState('verifyCode'); // 'verifyCode' o 'resetPassword'
  const [resetToken, setResetToken] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);




  useEffect(() => {
    // Verificar si el proceso ha expirado
    const expiration = localStorage.getItem('emailSentExpiration');
    if (expiration && new Date().getTime() > parseInt(expiration)) {
      setIsExpired(true);
      localStorage.removeItem('emailSent');
      localStorage.removeItem('emailSentExpiration');
      localStorage.removeItem('forgotPasswordEmail');
      setTimeout(() => navigate('/forgot-password'), 3000);
    }
  }, [navigate]);

  const requestVerificationCode = async () => {
    try {
      const recaptchaToken = await onSubmitWithRecaptcha(null, async (event, recaptchaToken) => {
        return recaptchaToken;
      });
  
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/request-verification-code/${token}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recaptchaToken }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setIsCodeSent(true);
        setMessage('Se ha enviado un código de verificación a tu correo electrónico.');
      } else {
        setError({ ...error, global: data.message || 'Error al enviar el código de verificación.' });
      }
    } catch (error) {
      console.error('Error:', error);
      setError({ ...error, global: 'Error al solicitar el código de verificación.' });
    }
  };

  const validatePassword = (password) => {
    let errorMessage = '';
    if (password.length < 8 || password.length > 20) {
      errorMessage = 'La contraseña debe tener entre 8 y 20 caracteres';
    } else if (!/[A-Z]/.test(password)) {
      errorMessage = 'La contraseña debe contener al menos una letra mayúscula';
    } else if (!/[a-z]/.test(password)) {
      errorMessage = 'La contraseña debe contener al menos una letra minúscula';
    } else if (!/\d/.test(password)) {
      errorMessage = 'La contraseña debe contener al menos un número';
    }
    return errorMessage;
  };

  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value;
    setPassword(passwordValue);
  
    const hasMinLength = passwordValue.length >= 8 && passwordValue.length <= 20;
    const hasUppercase = /[A-Z]/.test(passwordValue);
    const hasLowercase = /[a-z]/.test(passwordValue);
    const hasNumber = /\d/.test(passwordValue);
  
    setPasswordRequirements({
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
    });
  
    if (hasMinLength && hasUppercase && hasLowercase && hasNumber) {
      setError({ ...error, password: '' });
    }
  };
  

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleInputChange = () => {
    setError({ password: '', confirmPassword: '', global: '' });
  };

  const handleGoToHome = () => {
    const newPath = location.pathname.replace(`/${token}`, '');
    navigate(newPath, { replace: true });
  };

  // Verificar el código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
  
    if (isExpired) {
      setError({ ...error, global: 'El tiempo para cambiar la contraseña ha expirado. Por favor, inicie el proceso nuevamente.' });
      return;
    }
  
    const submitVerifyCode = async (event, recaptchaToken) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token, 
            verificationCode,
            recaptchaToken
          }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          setResetToken(data.resetToken);
          setMessage('Código verificado correctamente');
          setTimeout(() => {
            setStep('resetPassword');
            setMessage('');
          }, 1000);
        } else {
          setError({ ...error, verificationCode: data.message });
        }
      } catch (err) {
        setError({ ...error, global: 'Error al verificar el código' });
      }
    };
  
    await onSubmitWithRecaptcha(e, submitVerifyCode);
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
  
    if (isExpired) {
      setError({ ...error, global: 'El tiempo para cambiar la contraseña ha expirado. Por favor, inicie el proceso nuevamente.' });
      return;
    }
  
    if (!resetToken) {
      setError({ ...error, global: 'Debe verificar el código primero' });
      return;
    }
  
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError({ ...error, password: passwordError });
      return;
    }
  
    if (password !== confirmPassword) {
      setError({ ...error, confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }
  
    const submitResetPassword = async (event, recaptchaToken) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: resetToken,
            password,
            confirmPassword,
            recaptchaToken // Añadir el token de reCAPTCHA
          }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          setMessage('Contraseña actualizada con éxito');
          setError({});
          localStorage.removeItem('emailSent');
          localStorage.removeItem('forgotPasswordEmail');
          // Esperamos 2 segundos antes de redirigir
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError({ ...error, global: data.message });
        setIsLoading(false);
      }
    } catch (err) {
      setError({ ...error, global: 'Error al cambiar la contraseña' });
      setIsLoading(false);
    }
  };
  
    await onSubmitWithRecaptcha(e, submitResetPassword);
  };

  
  // Función para cancelar
  const handleCancel = () => {
    setMessage('Cancelando proceso...');
    localStorage.removeItem('emailSent');
    localStorage.removeItem('emailSentExpiration');
    localStorage.removeItem('forgotPasswordEmail');
    
    setTimeout(() => {
      navigate('/forgot-password');
    }, 1000);
  };

  return (
    <div className="reset-password-page">
      <Header />
      <div className="login-container">
        <div className="left-section">
          <img src="https://ibinternet.cl/wp-content/uploads/2024/10/Imagen-Ventas-2.png" alt="Ingbell" />
        </div>
        <div className="right-section">
          <div className="login-box">
            <h2>Cambiar contraseña</h2>
            
            {step === 'verifyCode' ? (
              <form onSubmit={handleVerifyCode}>
                <div className="form-group">
                  <label>Código de verificación</label>
                  <div className="input-container">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className={error.verificationCode ? 'error-input' : ''}
                      placeholder="Ingrese el código de verificación"
                    />
                  </div>
                  {error.verificationCode && (
                    <p className="error-message">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {error.verificationCode}
                    </p>
                  )}
                </div>
                <button type="submit" className="submit-button">
                  Verificar código
                </button>
                {message && (
                  <div className="success-message">
                    <FontAwesomeIcon icon={faCheckCircle} /> {message}
                  </div>
                )}
                <button 
                  type="button" 
                  className="cancel-button-password"
                  onClick={handleCancel}
                >
                  Cancelar proceso
                </button>
              </form>
              
            ) : (
              // Formulario de cambio de contraseña
              <form onSubmit={handleResetPassword}>
                {/* Campos de contraseña */}
                <div className="form-group">
                  <label>Contraseña nueva</label>
                  <div className="input-container">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        handlePasswordChange(e);
                        handleInputChange();
                      }}
                      required
                      className={error.password ? 'error-input' : ''}
                    />
                    <span className="password-icon" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                    </span>
                  </div>
                  {error.password && (
                    <p className="error-message">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {error.password}
                    </p>
                  )}
                  
                  {/* Agregar los requisitos de la contraseña */}
                  <div className="password-requirements">
                    <p className="requirements-title">La contraseña debe contener:</p>
                    <ul>
                      <li className={passwordRequirements.hasMinLength ? 'met' : ''}>
                        <FontAwesomeIcon 
                          icon={passwordRequirements.hasMinLength ? faCheckCircle : faExclamationCircle} 
                          className={passwordRequirements.hasMinLength ? 'success' : 'warning'}
                        />
                        Entre 8 y 20 caracteres
                      </li>
                      <li className={passwordRequirements.hasUppercase ? 'met' : ''}>
                        <FontAwesomeIcon 
                          icon={passwordRequirements.hasUppercase ? faCheckCircle : faExclamationCircle}
                          className={passwordRequirements.hasUppercase ? 'success' : 'warning'}
                        />
                        Al menos una letra mayúscula
                      </li>
                      <li className={passwordRequirements.hasLowercase ? 'met' : ''}>
                        <FontAwesomeIcon 
                          icon={passwordRequirements.hasLowercase ? faCheckCircle : faExclamationCircle}
                          className={passwordRequirements.hasLowercase ? 'success' : 'warning'}
                        />
                        Al menos una letra minúscula
                      </li>
                      <li className={passwordRequirements.hasNumber ? 'met' : ''}>
                        <FontAwesomeIcon 
                          icon={passwordRequirements.hasNumber ? faCheckCircle : faExclamationCircle}
                          className={passwordRequirements.hasNumber ? 'success' : 'warning'}
                        />
                        Al menos un número
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="form-group">
                  <label>Repetir contraseña</label>
                  <div className="input-container">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      required
                      className={error.confirmPassword ? 'error-input' : ''}
                    />
                    <span className="password-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                    </span>
                  </div>
                  {error.confirmPassword && (
                    <p className="error-message">
                      <FontAwesomeIcon icon={faExclamationCircle} /> {error.confirmPassword}
                    </p>
                  )}
                </div>
                <div>
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Procesando...' : 'Cambiar contraseña'}
                  </button>
                  {message && (
                    <div className="success-message">
                      <FontAwesomeIcon icon={faCheckCircle} /> {message}
                    </div>
                  )}
                  <button 
                    type="button" 
                    className="cancel-button-password"
                    onClick={handleCancel}
                    disabled={isLoading} 
                  >
                    Cancelar proceso
                  </button>
                </div>
              </form>
            )}
            {isExpired && (
              <div className="expired-notification">
                <FontAwesomeIcon icon={faExclamationCircle} />
                <span>El tiempo para cambiar la contraseña ha expirado. Por favor, inicie el proceso nuevamente.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default withRecaptcha(ResetPasswordPage, 'reset_password_action');