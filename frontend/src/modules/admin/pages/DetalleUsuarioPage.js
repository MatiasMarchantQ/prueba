import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRandom, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import withRecaptcha from '../../../HOC/withRecaptcha';
import withAuthorization from '../../../contexts/withAuthorization';
import './DetalleUsuario.css';

const DetalleUsuarioPage = ({ onBack, idUser, onSubmitWithRecaptcha }) => {
  const { token , roleId } = useContext(UserContext);
  const [editableFields, setEditableFields] = useState({
    first_name: '',
    last_name: '',
    rut: '',
    email: '',
    phone_number: '',
    company_id: '',
    region_id: '',
    commune_id: '',
    sales_channel_id: '',
    street: '',
    number: '',
    department_office_floor: '',
    role_id: '',
    password: '',
    contract_id: '',
  });

  const [isEnabled, setIsEnabled] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false); // Estado para controlar la visibilidad de la contraseña
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [originalFields, setOriginalFields] = useState({});
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };
  
        const response = await fetch(`${process.env.REACT_APP_API_URL}/contracts`, { headers });
        
        if (!response.ok) {
          throw new Error('Error obteniendo tipos de contrato');
        }
  
        const contractsData = await response.json();
        setContracts(contractsData);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
  
    fetchContracts();
  }, [idUser, token]);

  useEffect(() => {
    if (!idUser) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${idUser}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const userData = await response.json();
        const userFields = {
          ...userData.user,
          company_id: userData.user.company_id,
          region_id: userData.user.region_id,
          commune_id: userData.user.commune_id,
          sales_channel_id: userData.user.sales_channel_id,
          role_id: userData.user.role_id,
          contract_id: userData.user.contract_id,
        };
        setEditableFields(userFields);
        setOriginalFields(userFields);
        setIsEnabled(userData.user.status);
      } catch (error) {
        console.error('Fetch error:', error);
        setUserError(error.message);
      } finally {
        setUserLoading(false);
      }
    };
  
    fetchUserData();
  }, [idUser, token]);

  // Fetch auxiliary data
  const [regions, setRegions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);
  const [communes, setCommunes] = useState([]);

  useEffect(() => {
    const fetchAuxiliaryData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [regionsResponse, companiesResponse, rolesResponse, channelsResponse] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/regions`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/companies`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/roles`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/channels`, { headers }),
        ]);

        if (!regionsResponse.ok || !companiesResponse.ok || !rolesResponse.ok || !channelsResponse.ok) {
          throw new Error('Error obteniendo datos');
        }

        const [regionsData, companiesData, rolesData, channelsData] = await Promise.all([
          regionsResponse.json(),
          companiesResponse.json(),
          rolesResponse.json(),
          channelsResponse.json(),
        ]);

        setRegions(regionsData);
        setCompanies(companiesData);
        setRoles(rolesData);
        setChannels(channelsData);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchAuxiliaryData();
  }, [token]);

  useEffect(() => {
    if (!editableFields.region_id) {
      setCommunes([]);
      return;
    }
  
    const headers = {
      Authorization: `Bearer ${token}`,
    };
  
    const fetchCommunes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/communes/region/${editableFields.region_id}`, {
          headers,
        });
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        const communesData = await response.json();
        setCommunes(communesData);
      } catch (error) {
        setCommunes([]);
      }
    };
  
    fetchCommunes();
  }, [editableFields.region_id, token]);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    if (name === 'sale_status_id' && value === '1') {
      setEditableFields(prev => ({ ...prev, sale_status_reason_id: '1' }));
    } else {
      setEditableFields(prev => {
        const updates = {
          ...prev,
          [name]: ['company_id', 'region_id', 'commune_id', 'sales_channel_id', 'role_id', 'contract_id', 'status'].includes(name)
            ? (value === '' ? null : Number(value))
            : value || ''
        };
  
        // Si se está cambiando el rol y no es 3, limpiar contract_id
        if (name === 'role_id' && Number(value) !== 3) {
          updates.contract_id = null;
        }
  
        return updates;
      });
    }
  
    if (name === 'region_id') {
      setEditableFields(prev => ({ ...prev, commune_id: null }));
    }
  }, []);

  const handleSubmit = useCallback(async (e, recaptchaToken) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      setUserError('Error de verificación reCAPTCHA. Por favor, inténtelo de nuevo.');
      return;
    }
  
    const dataToSend = { ...editableFields };
  
    let isPasswordUpdated = false;
    if (dataToSend.password !== originalFields.password && dataToSend.password !== '') {
      const confirmUpdate = window.confirm("Está a punto de actualizar la contraseña. ¿Está seguro de que desea continuar?");
      if (!confirmUpdate) {
        return;
      }
      isPasswordUpdated = true;
    } else {
      delete dataToSend.password;
    }
  
    dataToSend.recaptchaToken = recaptchaToken;
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/update/${idUser}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el usuario');
      }
  
      setIsUpdated(true);
      setPasswordUpdated(isPasswordUpdated);
    } catch (error) {
      console.error('Error updating user:', error);
      setUserError(error.message);
    }
  }, [editableFields, idUser, token, originalFields]);

  const handleCancel = () => {
    setEditableFields(originalFields);
  };

  const renderInput = useCallback((name, type, labelText) => (
    <p key={name}>
      <label className="detalle-usuario-label" htmlFor={name}>{labelText}</label>
      <input
        className="detalle-usuario-value"
        id={name}
        type={type}
        name={name}
        value={editableFields[name] || ''}
        onChange={handleInputChange}
        autoComplete={name === 'password' ? "off" : "on"}
      />
    </p>
  ), [editableFields, handleInputChange]);

  const renderSelect = useCallback((name, options, labelText, disabled = false) => (
    <p key={name}>
      <label className="detalle-usuario-label" htmlFor={name}>{labelText}</label>
      <select
        className="detalle-usuario-value"
        id={name}
        name={name}
        value={editableFields[name] || ''}
        onChange={handleInputChange}
        disabled={disabled}
      >
        <option value="">Seleccione {labelText.toLowerCase()}</option>
        {options && options.length > 0 ? (
          options.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))
        ) : (
          <option disabled>No hay opciones disponibles</option>
        )}
      </select>
    </p>
  ), [editableFields, handleInputChange]);

  const formattedCompanies = useMemo(() => {
    return companies ? companies.map(c => ({ id: c.company_id, name: c.company_name })) : [];
  }, [companies]);

  const formattedContracts = useMemo(() => {
    return contracts ? contracts.map(c => ({ id: c.contract_id, name: c.contract_name })) : [];
  }, [contracts]);
  
  const formattedRegions = useMemo(() => {
    return regions ? regions.map(r => ({ id: r.region_id, name: r.region_name })) : [];
  }, [regions]);
  
  const formattedCommunes = useMemo(() => {
    return communes ? communes.map(c => ({ id: c.commune_id, name: c.commune_name })) : [];
  }, [communes]);
  
  const formattedChannels = useMemo(() => {
    return channels ? channels.map(c => ({ id: c.sales_channel_id, name: c.channel_name })) : [];
  }, [channels]);
  
  const formattedRoles = useMemo(() => {
    return roles ? roles.map(r => ({ id: r.role_id, name: r.role_name })) : [];
  }, [roles]);

  const generateRandomPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const allChars = lowercase + uppercase + numbers;
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    const length = Math.floor(Math.random() * (20 - 8 + 1)) + 8; // longitud entre 8 y 20
    for (let i = 3; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setEditableFields(prev => ({ ...prev, password }));
  };

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);


  useEffect(() => {
    validatePassword(editableFields.password);
  }, [editableFields.password]);

  const validatePassword = (password) => {
    const errors = [];
    if (password) {
      if (password.length < 8 || password.length > 20) {
        errors.push('La contraseña debe tener entre 8 y 20 caracteres');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra mayúscula');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula');
      }
      if (!/\d/.test(password)) {
        errors.push('La contraseña debe contener al menos un número');
      }
    }
    setPasswordErrors(errors);
  };

  if (userLoading) {
    return <div>Cargando...</div>;
  }

  if (userError) {
    return <div>Error: {userError}</div>;
  }

  return (
    <div className="detalle-usuario-page">
      <button className="detalle-usuario-button" onClick={onBack}>Volver a atrás</button>
      <div className="detalle-usuario-container">
        <h1 className="detalle-usuario-header">Editar Usuario</h1>
        {userError && <div className="error-message">{userError}</div>}
        <form onSubmit={(e) => onSubmitWithRecaptcha(e, handleSubmit, 'update_user_admin')} className="detalle-usuario-info" autoComplete="off">
            {renderInput('first_name', 'text', 'Nombres')}
            {renderInput('last_name', 'text', 'Apellidos')}
            {renderInput('rut', 'text', 'RUT')}
            {renderInput('email', 'email', 'Correo Electrónico')}
            {renderInput('phone_number', 'text', 'Teléfono')}
            {renderSelect('company_id', formattedCompanies, 'Empresa', roleId === 2)} 
            {renderSelect('region_id', formattedRegions, 'Región')}
            {renderSelect('commune_id', formattedCommunes, 'Comuna', !editableFields.region_id)}
            {renderInput('street', 'text', 'Calle/Avenida')}
            {renderInput('number', 'text', 'Número')}
            {renderInput('department_office_floor', 'text', 'Departamento/Oficina/Piso', 'off')}
            {renderSelect('sales_channel_id', formattedChannels, 'Canal de Venta')}
            {renderSelect('role_id', formattedRoles, 'Rol')}
            {editableFields.role_id === 3 
              ? renderSelect('contract_id', formattedContracts, 'Tipo de Contrato')
              : <div style={{ marginBottom: '1rem' }}></div>
            }
            {renderSelect('status', [
              { id: 1, name: 'Activo' },
              { id: 0, name: 'Inactivo' },
            ], 'Estado')}           
            <div className='password-section'>
              <label className="detalle-usuario-label" htmlFor="password">Contraseña</label>
              <div className="password-input-container">
                <input
                  className="detalle-usuario-value"
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  name="password"
                  value={editableFields.password || ''}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                <div className="password-buttons">
                  <button type="button" onClick={togglePasswordVisibility} className="password-button">
                    <FontAwesomeIcon icon={passwordVisible ? faEyeSlash : faEye} />
                  </button>
                  <button type="button" onClick={generateRandomPassword} className="password-button">
                    <FontAwesomeIcon icon={faRandom} />
                  </button>
                </div>
              </div>
              {editableFields.password !== originalFields.password && editableFields.password !== '' && (
                <div className="password-warning">
                  Atención: La contraseña será actualizada al guardar los cambios.
                </div>
              )}
              {passwordErrors.length > 0 && (
                <ul className="password-errors">
                  {passwordErrors.map((error, index) => (
                    <li key={index} className="password-error">{error}</li>
                  ))}
                </ul>
              )}
            </div>
          <div className="button-container">
            <button className="detalle-usuario-submit" type="submit" disabled={isUpdated}>
              {isUpdated ? 'Actualizado' : 'Actualizar'}
            </button>
            {!isUpdated && (
              <button 
                type="button" 
                className="cancelar-button" 
                onClick={handleCancel}
              >
                Cancelar
              </button>
            )}
            {isUpdated && (
              <button 
                type="button" 
                className="volver-editar-button" 
                onClick={() => setIsUpdated(false)}
              >
                Volver a editar
              </button>
            )}
          </div>
        </form>
        {isUpdated && (
          <div className="update-confirmation">
            Usuario actualizado con éxito!
            {passwordUpdated && (
              <div className="password-update-info">
                <p>Email: {editableFields.email}</p>
                <p>Nueva contraseña: {editableFields.password}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuthorization(
  withRecaptcha(DetalleUsuarioPage, 'update_user_admin'),
  [1, 2]
);