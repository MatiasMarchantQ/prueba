import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import './ChangePassword.css';

const ChangePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { token } = useParams();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = () => {
        setError('');
        setSuccess('');
      };

    const PasswordRequirements = () => {
        const hasLength = password.length >= 8 && password.length <= 20;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);

        return (
            <div className="password-requirements">
                <ul>
                    <li>
                        <FontAwesomeIcon 
                            icon={hasLength ? faCheckCircle : faExclamationCircle} 
                            color={hasLength ? "#fff" : "#fff"} // Cambiar color según el estado
                        />
                        {' '}La contraseña debe tener entre 8 y 20 caracteres
                    </li>
                    <li>
                        <FontAwesomeIcon 
                            icon={hasUppercase ? faCheckCircle : faExclamationCircle} 
                            color={hasUppercase ? "#fff" : "#fff"}
                        />
                        {' '}La contraseña debe contener al menos una letra mayúscula
                    </li>
                    <li>
                        <FontAwesomeIcon 
                            icon={hasLowercase ? faCheckCircle : faExclamationCircle} 
                            color={hasLowercase ? "#fff" : "#fff"}
                        />
                        {' '}La contraseña debe contener al menos una letra minúscula
                    </li>
                    <li>
                        <FontAwesomeIcon 
                            icon={hasNumber ? faCheckCircle : faExclamationCircle} 
                            color={hasNumber ? "#fff" : "#fff"}
                        />
                        {' '}La contraseña debe contener al menos un número
                    </li>
                </ul>
            </div>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
    
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }
        if (password.length < 8 || password.length > 20) {
            setError('La contraseña debe tener entre 8 y 20 caracteres.');
            setIsLoading(false);
            return;
        }
    
        try {
            // Asegúrate de que la URL sea correcta
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/change-password/${token}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    password, 
                    confirmPassword,
                }),
            });
    
            // Primero verifica el tipo de contenido de la respuesta
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                
                if (response.ok) {
                    setSuccess('Contraseña actualizada con éxito');
                    setError('');
                    setTimeout(() => navigate('/'), 1000);
                } else {
                    setError(data.message || 'Error al actualizar la contraseña');
                    setSuccess('');
                    setIsLoading(false);
                }
            } else {
                // Si la respuesta no es JSON, maneja el error apropiadamente
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error en el servidor:', err);
            setError(err.message || 'Error del servidor');
            setSuccess('');
            setIsLoading(false);
        }
    };

    return (
        <div className="change-password-page">
            <Header />
            <div className="login-container">
                <div className="left-section">
                    <img src="/images/Imagen-Ventas-2.png" alt="Ingbell" />
                </div>
                <div className="right-section">
                    <div className="change-box">
                        <form className="change-password" onSubmit={handleSubmit }>
                            <h3>Cambiar Contraseña</h3> 
                            <div className="form-group">
                            <label htmlFor="new-password">Contraseña nueva</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="new-password"
                                    value={password}
                                    onChange={(e) => {
                                    setPassword(e.target.value);
                                    handleInputChange();
                                    }}
                                    required
                                />
                                <span className="show-password" onClick={() => setShowPassword(!showPassword)}>
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </span>
                            </div>
                            </div>
                            <PasswordRequirements />
                            <div className="form-group">
                            <label htmlFor="confirm-password">Repetir contraseña</label>
                            <div className="input-group">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirm-password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    handleInputChange();
                                    }}
                                    required
                                />
                                <span className="show-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                </span>
                            </div>
                            </div>
                            <button 
                                className="submit-button" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
                            </button>
                            {error && <p className="error-message">{error}</p>}
                            {success && <p className="success-message">{success}</p>}
                        </form>
                        <Link to="/" className="link-button-change">Volver al Inicio</Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ChangePasswordPage;