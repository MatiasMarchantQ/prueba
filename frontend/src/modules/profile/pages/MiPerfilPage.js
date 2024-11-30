import React, { useEffect, useState, useContext, useCallback } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import withRecaptcha from '../../../HOC/withRecaptcha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash , faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import withAuthorization from '../../../contexts/withAuthorization';
import './MiPerfil.css';

const MiPerfilPage = ({ onSubmitWithRecaptcha }) => {
    const { token, userId } = useContext(UserContext);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [formValues, setFormValues] = useState({
        first_name: '',
        last_name: '',
        rut: '',
        email: '',
        phone_number: '',
        street: '',
        number: '',
        department_office_floor: '',
        region_id: '',
        commune_id: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [regions, setRegions] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [salesChannels, setSalesChannels] = useState([]);
    const [roles, setRoles] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [contracts, setContracts] = useState([]);

    const fieldLabels = {
        role_id: 'Rol',
        first_name: 'Nombre',
        last_name: 'Apellido',
        rut: 'RUT',
        email: 'Correo Electrónico',
        phone_number: 'Número de Teléfono',
        company_id: 'Empresa',
        region_id: 'Región',
        commune_id: 'Comuna',
        street: 'Calle/Avenida',
        number: 'Número casa',
        department_office_floor: 'Departamento / Piso / Oficina (Opcional)',
        sales_channel_id: 'Canal de Venta',
        contract_id: 'Tipo de Contrato',
    };

    const fetchUserData = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Error al obtener los datos del usuario');
            const data = await response.json();
            const { user_id, ...filteredData } = data;

            setUserData(filteredData);
            setFormValues(filteredData);
        } catch (error) {
            setError(error.message);
        }
    }, [token]);

    const fetchRoles = async () => {
        try {
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          const response = await fetch(`${process.env.REACT_APP_API_URL}/roles`, { headers });
          if (!response.ok) throw new Error('Error al obtener los roles');
          const data = await response.json();
          setRoles(data);
        } catch (error) {
          setError(error.message);
        }
      };

    const fetchRegions = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              };
            const response = await fetch(`${process.env.REACT_APP_API_URL}/regions/`, { headers });
            if (!response.ok) throw new Error('Error al obtener las regiones');
            const data = await response.json();
            setRegions(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchCompanies = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              };
            const response = await fetch(`${process.env.REACT_APP_API_URL}/companies`, { headers });
            if (!response.ok) throw new Error('Error al obtener las empresas');
            const data = await response.json();
            setCompanies(data);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchSalesChannels = async () => {
        try {
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          const response = await fetch(`${process.env.REACT_APP_API_URL}/channels`, { headers });
          if (!response.ok) {
            if (response.status === 500) {
              setError('Error interno del servidor. Por favor, inténtelo de nuevo más tarde.');
            } else {
              setError('Error al obtener los canales de venta');
            }
          } else {
            const data = await response.json();
            if (Array.isArray(data)) {
              setSalesChannels(data);
            } else {
              console.error('La respuesta no es un arreglo');
            }
          }
        } catch (error) {
          setError(error.message);
        }
      };

      const fetchCommunes = async (regionId) => {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            const response = await fetch(`${process.env.REACT_APP_API_URL}/communes/communes/${regionId}`, { headers });
            if (response.status === 404) {
                setCommunes([]);
                return;
            }
            if (!response.ok) throw new Error('Error al obtener las comunas');
            const data = await response.json();
            setCommunes(data);
        } catch (error) {
            setCommunes([]);
        }
    };

    useEffect(() => {
        fetchUserData();
        fetchRoles();
        fetchCompanies();
        fetchRegions();
        fetchSalesChannels();
    }, [fetchUserData]);

    useEffect(() => {
        if (formValues.region_id) {
            fetchCommunes(formValues.region_id);
        } else {
            setCommunes([]);
        }
    }, [formValues.region_id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value || '' }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value || '' }));
        setPasswordError('');
    };

    const validatePassword = () => {
        const { newPassword, confirmPassword } = passwordData;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,20}$/;
    
        if (!passwordRegex.test(newPassword)) {
            setPasswordError('La contraseña debe tener entre 8 y 20 caracteres, al menos una mayúscula, una minúscula y un número.');
            return false;
        }
    
        if (newPassword !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden.');
            return false;
        }
    
        return true;
    };

    const handleSubmit = async (e, recaptchaToken) => {
        e.preventDefault();
        
        // Verifica si hay token de reCAPTCHA
        if (!recaptchaToken) {
            setError('Error de verificación reCAPTCHA. Por favor, inténtelo de nuevo.');
            return;
        }
    
        try {
            // Elimina campos innecesarios antes de enviar
            const { role, reset_code, reset_code_expires, created_at, updated_at, password, must_change_password, status, modified_by_user_id, ...dataToSend } = formValues;
    
            const requestData = {
                ...dataToSend,
                recaptchaToken
            };
    
            const response = await fetch(`${process.env.REACT_APP_API_URL}/users/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar los datos del usuario');
            }
    
            alert('Datos actualizados correctamente');
            await fetchUserData();
            setIsEditing(false);
            setError(null);
        } catch (error) {
            setError(error.message);
            console.error('Error completo:', error);
        }
    };

    const handlePasswordSubmit = async (e, recaptchaToken) => {
        e.preventDefault();
        
        if (!recaptchaToken) {
            setPasswordError('Error de verificación reCAPTCHA. Por favor, inténtelo de nuevo.');
            return;
        }
    
        if (!validatePassword()) {
            return; // validatePassword ya establece el mensaje de error
        }
    
        try {
            const requestData = {
                ...passwordData,
                recaptchaToken
            };
    
            const response = await fetch(`${process.env.REACT_APP_API_URL}/users/users/me/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar la contraseña');
            }
    
            alert('Contraseña actualizada correctamente');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordError('');
        } catch (error ) {
            setPasswordError(error.message);
        }
    };

    const handleCancel = () => {
        setFormValues(userData);
        setIsEditing(false);
    };

    const PasswordRequirements = ({ password }) => {
        const hasLength = password.length >= 8 && password.length <= 20;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
      
        return (
          <div className="password-requirements">
            <h3>Requisitos de la contraseña:</h3>
            <ul>
              <li>
                <FontAwesomeIcon 
                  icon={hasLength ? faCheckCircle : faExclamationCircle} 
                  color={hasLength ? "#99235C" : "#99235C"}
                />
                {' '}La contraseña debe tener entre 8 y 20 caracteres
              </li>
              <li>
                <FontAwesomeIcon 
                  icon={hasUppercase ? faCheckCircle : faExclamationCircle} 
                  color={hasUppercase ? "#99235C" : "#99235C"}
                />
                {' '}La contraseña debe contener al menos una letra mayúscula
              </li>
              <li>
                <FontAwesomeIcon 
                  icon={hasLowercase ? faCheckCircle : faExclamationCircle} 
                  color={hasLowercase ? "#99235C" : "#99235C"}
                />
                {' '}La contraseña debe contener al menos una letra minúscula
              </li>
              <li>
                <FontAwesomeIcon 
                  icon={hasNumber ? faCheckCircle : faExclamationCircle} 
                  color={hasNumber ? "#99235C" : "#99235C"}
                />
                {' '}La contraseña debe contener al menos un número
              </li>
            </ul>
          </div>
        );
      };

    if (!userData) return <div>Cargando datos del perfil...</div>;

    return (
        <div className="mi-perfil-container">
            <h1>Mi Perfil</h1>
            {/* Formulario de datos personales */}
            <form onSubmit={(e) => onSubmitWithRecaptcha(e, handleSubmit, 'update_profile')} className="user-form">
                <div className="user-details">
                    <div className="user-info">
                        <strong>Rol </strong>
                        <span>{roles.find(role => role.role_id === userData.role_id)?.role_name}</span>
                    </div>
                    <div className="user-info">
                        <strong>{fieldLabels.company_id} </strong>
                        <span>{companies.find(company => company.company_id === userData.company_id)?.company_name}</span>
                    </div>
                    <div className="user-info">
                        <strong>{fieldLabels.sales_channel_id} </strong>
                        <span>{salesChannels.find(c => c.sales_channel_id === userData.sales_channel_id)?.channel_name || "No aplica"}</span>
                    </div>
                    {['first_name', 'last_name'].map((field, index) => (
                        <div className="user-info" key={index}>
                            <strong>{fieldLabels[field]} </strong>
                            {isEditing ? (
                            <input
                                type="text"
                                name={field}
                                value={formValues[field] || ''}
                                onChange={handleInputChange}
                            />
                            ) : (
                            <span>{userData[field]}</span>
                            )}
                        </div>
                    ))}
                    <div className="user-info">
                        <strong>{fieldLabels.rut} </strong>
                        <span>{userData.rut}</span>
                    </div>
                    {['email', 'phone_number'].map((field, index) => (
                        <div className="user-info" key={index}>
                            <strong>{fieldLabels[field]} </strong>
                            {isEditing ? (
                            field === 'email' ? (
                                <textarea
                                name={field}
                                value={formValues[field] || ''}
                                onChange={handleInputChange}
                                rows={2}
                                style={{ width: '100%', resize: 'none' }}
                                />
                            ) : (
                                <input
                                type={field === 'email' ? 'email' : 'text'}
                                name={field}
                                value={formValues[field] || ''}
                                onChange={handleInputChange}
                                />
                            )
                            ) : (
                            <span>{userData[field]}</span>
                            )}
                        </div>
                    ))}
                    {userData.role_id === 3 ? (
                        <div className="user-info">
                            <strong>{fieldLabels.contract_id} </strong>
                            <span>
                                {userData.contract?.contract_name || "No especificado"}
                            </span>
                        </div>
                    ) : (
                        <div className="space"></div>
                    )}
                    <div className="user-info">
                        <strong>{fieldLabels.region_id} </strong>
                        {isEditing ? (
                            <select
                                name="region_id"
                                value={formValues.region_id || ''}
                                onChange={handleInputChange}
                            >
                                <option value="">Seleccione una región</option>
                                {regions.map(region => (
                                    <option key={region.region_id} value={region.region_id}>{region.region_name}</option>
                                ))}
                            </select>
                        ) : (
                            <span>
                                {userData.region_id
                                    ? regions.find(r => r.region_id === userData.region_id)?.region_name
                                    : 'No especificada'}
                            </span>
                        )}
                    </div>
                    <div className="user-info">
                        <strong>{fieldLabels.commune_id} </strong>
                        {isEditing ? (
                            <select
                                name="commune_id"
                                value={formValues.commune_id || ''}
                                onChange={handleInputChange}
                                disabled={!formValues.region_id}
                            >
                                {!formValues.region_id ? (
                                    <option value="" disabled>Seleccione una región primero</option>
                                ) : communes.length > 0 ? (
                                    <>
                                        <option value="">Seleccione una comuna</option>
                                        {communes.map(commune => (
                                            <option key={commune.commune_id} value={commune.commune_id}>
                                                {commune.commune_name}
                                            </option>
                                        ))}
                                    </>
                                ) : (
                                    <option value="" disabled>No hay comunas disponibles</option>
                                )}
                            </select>
                        ) : (
                            <span>
                                {userData.commune_id
                                    ? communes.find(c => c.commune_id === userData.commune_id)?.commune_name
                                    : 'No especificada'}
                            </span>
                        )}
                    </div>
                    <div className="user-info">
                    <div>
                        <strong>{fieldLabels.street} </strong><br/>
                        {isEditing ? (
                        <input
                            type="text"
                            name="street"
                            value={formValues.street || ''}
                            onChange={handleInputChange}
                        />
                        ) : (
                        <span>{userData.street}</span>
                        )}
                    </div>
                    <div>
                        <strong>{fieldLabels.number}</strong><br/>
                        {isEditing ? (
                        <input
                            type="text"
                            name="number"
                            value={formValues.number || ''}
                            onChange={handleInputChange}
                        />
                        ) : (
                        <span>{userData.number}</span>
                        )}
                    </div>
                        <div>
                            <strong>{fieldLabels.department_office_floor}</strong><br/>
                            {isEditing ? (
                            <input
                                type="text"
                                name="department_office_floor"
                                value={formValues.department_office_floor || ''}
                                onChange={handleInputChange}
                            />
                            ) : (
                            <span>{userData.department_office_floor}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="user-actions">
                    {!isEditing ? (
                        <button type="button" onClick={() => setIsEditing(true)}>Modificar datos</button>
                    ) : (
                        <div>
                            <button type="submit">Guardar</button>
                            <button type="button" onClick={handleCancel}>Cancelar</button>
                        </div>
                    )}
                </div>
            </form>
            <div className="change-password">
                <h2>Cambiar Contraseña</h2>
                <div className="password-container">
                <form className="password-form" onSubmit={(e) => onSubmitWithRecaptcha(e, handlePasswordSubmit, 'change_password')}>
                        <div className="password-section">
                            {['currentPassword', 'newPassword', 'confirmPassword'].map((field, index) => (
                                <div className="input-container" key={index}>
                                    <label htmlFor={field}>
                                        {field === 'currentPassword' ? 'Contraseña Actual' : 
                                        field === 'newPassword' ? 'Nueva Contraseña' : 
                                        'Confirmar Nueva Contraseña'}
                                    </label>
                                    <div className="input-wrapper">
                                        <input
                                            type={
                                                field === 'currentPassword' ? (showPassword ? 'text' : 'password') :
                                                field === 'newPassword' ? (showNewPassword ? 'text' : 'password') :
                                                (showConfirmPassword ? 'text' : 'password')
                                            }
                                            id={field}
                                            name={field}
                                            value={passwordData[field]}
                                            onChange={handlePasswordChange}
                                        />
                                        <FontAwesomeIcon
                                            icon={
                                                field === 'currentPassword' ? (showPassword ? faEyeSlash : faEye) :
                                                field === 'newPassword' ? (showNewPassword ? faEyeSlash : faEye) :
                                                (showConfirmPassword ? faEyeSlash : faEye)
                                            }
                                            className="toggle-password"
                                            onClick={() => {
                                                if (field === 'currentPassword') setShowPassword(!showPassword);
                                                else if (field === 'newPassword') setShowNewPassword(!showNewPassword);
                                                else setShowConfirmPassword(!showConfirmPassword);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <PasswordRequirements password={passwordData.newPassword} />
                        <button type="submit" className='update-button'>Actualizar Contraseña</button>
                        {passwordError && <div className="error-message">{passwordError}</div>}
                    </form>
                </div>
            </div> 
        </div>
    );
};

export default withAuthorization(
    withRecaptcha(MiPerfilPage, 'update_profile', 'change_password'),
    [1, 2, 3, 4, 5, 6]
);