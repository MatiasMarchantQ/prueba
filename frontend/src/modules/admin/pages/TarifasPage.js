import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import withRecaptcha from '../../../HOC/withRecaptcha';
import './ComunasTarifas.css'

// Utility function for API calls
const apiCall = async (url, method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  const config = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };
  const response = await fetch(url, config);
  if (!response.ok) throw new Error('API call failed');
  return response.json();
};

// Custom hook for toggling card visibility
const useToggleCard = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const toggle = () => setIsOpen(prev => !prev);
  return [isOpen, toggle];
};

// Card component
const Card = ({ title, children, isOpen, toggle }) => (
  <div className="card" onClick={toggle}>
    <h2>{title}</h2>
    {isOpen && <div onClick={(e) => e.stopPropagation()}>{children}</div>}
  </div>
);

// Reusable select component
const Select = ({ value, onChange, options, placeholder }) => (
  <select 
    value={value} 
    onChange={(e) => {
      onChange(e.target.value);
      e.stopPropagation();
    }} 
    onClick={(e) => e.stopPropagation()}
    required
  >
    <option value="">{placeholder}</option>
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// Ver opciones
const ViewOptions = ({ token, regions }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [communes, setCommunes] = useState([]);
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState('');
  const [installationAmount, setInstallationAmount] = useState('');

  // Cargar comunas cuando se selecciona una región
  useEffect(() => {
    if (selectedRegionId) {
      apiCall(`${process.env.REACT_APP_API_URL}/communes/communes/${selectedRegionId}`,'GET', null, token)
        .then(setCommunes)
        .catch(error => console.error('Error al cargar las comunas:', error));
    } else {
      setCommunes([]); // Limpiar comunas si no hay región seleccionada
    }
  }, [selectedRegionId, token]);

  // Cargar promociones cuando se selecciona una comuna
  useEffect(() => {
    if (selectedCommuneId) {
      // Cambiar el endpoint para obtener promociones por comuna
      apiCall(`${process.env.REACT_APP_API_URL}/sales/promotions/commune/${selectedCommuneId}`,'GET', null, token)
        .then(setPromotions)
        .catch(error => console.error('Error al cargar las promociones:', error));
    } else {
      setPromotions([]); // Limpiar promociones si no hay comuna seleccionada
    }
  }, [selectedCommuneId, token]);

  // Cargar monto de instalación cuando se selecciona una promoción
  useEffect(() => {
    if (selectedPromotionId) {
      apiCall(`${process.env.REACT_APP_API_URL}/sales/installation-amounts/promotion/${selectedPromotionId}`,'GET', null, token)
        .then(response => setInstallationAmount(response))
        .catch(error => console.error('Error al cargar el monto de instalación:', error));
    } else {
      setInstallationAmount(''); // Limpiar el monto si no hay promoción seleccionada
    }
  }, [selectedPromotionId, token]);

  // Manejar cambios de selección
  const handleRegionChange = (event) => {
    setSelectedRegionId(event.target.value);
    setSelectedCommuneId(''); // Limpiar comuna seleccionada
    setSelectedPromotionId(''); // Limpiar promoción seleccionada
    setInstallationAmount(''); // Limpiar monto de instalación
  };

  const handleCommuneChange = (event) => {
    setSelectedCommuneId(event.target.value);
    setSelectedPromotionId(''); // Limpiar promoción seleccionada
    setInstallationAmount(''); // Limpiar monto de instalación
  };

  const handlePromotionChange = (event) => {
    setSelectedPromotionId(event.target.value);
  };

  return (
    <div className="card">
      <h3>Seleccione una Región</h3>
      <select value={selectedRegionId} onChange={handleRegionChange}>
        <option value="">Seleccione una región</option>
        {regions.map(region => (
          <option key={region.region_id} value={region.region_id}>
            {region.region_name}
          </option>
        ))}
      </select>

      {selectedRegionId && (
        <>
          <h3>Seleccione una Comuna</h3>
          <select value={selectedCommuneId} onChange={handleCommuneChange}>
            <option value="">Seleccione una comuna</option>
            {communes.map(commune => (
              <option key={commune.commune_id} value={commune.commune_id}>
                {commune.commune_name}
              </option>
            ))}
          </select>
        </>
      )}

      {selectedCommuneId && (
        <>
          <h3>Seleccione una Promoción</h3>
          <select value={selectedPromotionId} onChange={handlePromotionChange}>
            <option value="">Seleccione una promoción</option>
            {promotions.length === 0 ? (
              <option value="">No hay promociones asociadas</option>
            ) : (
              promotions.map(promotion => (
                <option key={promotion.promotion_id} value={promotion.promotion_id}>
                  {promotion.promotion}
                </option>
              ))
            )}
          </select>
        </>
      )}

      {selectedPromotionId && (
        <div>
          <h3>Monto de Instalación</h3>
          <p>{installationAmount && installationAmount.amount ? installationAmount.amount : 'No disponible'}</p>
        </div>
      )}
    </div>
  );
};

// CreatePromotion component
const CreatePromotion = ({ token, installationAmounts, onSubmitWithRecaptcha }) => {
  const [promotionName, setPromotionName] = useState('');
  const [selectedInstallationAmountId, setSelectedInstallationAmountId] = useState('');

  const handleCreatePromotion = async (event) => {
    event.preventDefault();
    if (!promotionName || !selectedInstallationAmountId) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/promotions`, 
          'POST', 
          {
            promotion: promotionName,
            installationAmountId: selectedInstallationAmountId,
            recaptchaToken
          }, 
          token
        );
        alert(`Promoción creada: ${result.message}`);
        setPromotionName('');
        setSelectedInstallationAmountId('');
        window.location.reload();
      } catch (error) {
        alert('Error al crear la promoción');
      }
    };

    await onSubmitWithRecaptcha(event, submitForm);
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleCreatePromotion}>
      <div className="comunas-tarifas-field-group">
        <label htmlFor="promotionName">
          Nombre de la Promoción:
          <input
            id="promotionName"
            name="promotionName"
            className="comunas-tarifas-field"
            type="text"
            value={promotionName}
            onChange={(event) => setPromotionName(event.target.value)}
            required
          />
        </label>
      </div>
      <div className="comunas-tarifas-field-group">
        <label>Monto de Instalación:</label>
        <Select
          className="comunas-tarifas-field"
          value={selectedInstallationAmountId}
          onChange={setSelectedInstallationAmountId}
          options={installationAmounts.map((amount) => ({
            value: amount.installation_amount_id,
            label: amount.amount,
          }))}
          placeholder="Seleccione un monto"
        />
      </div>
      <button className="comunas-tarifas-submit-button" type="submit">
        Crear Promoción
      </button>
    </form>
  );
};

// UpdatePromotion component
const UpdatePromotion = ({ token, promotions, installationAmounts, onSubmitWithRecaptcha }) => {
  const [selectedPromotionId, setSelectedPromotionId] = useState('');
  const [updatedPromotionName, setUpdatedPromotionName] = useState('');
  const [updatedInstallationAmountId, setUpdatedInstallationAmountId] = useState('');

  const handleUpdatePromotion = async (e) => {
    e.preventDefault();
    if (!selectedPromotionId || !updatedPromotionName || !updatedInstallationAmountId) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/promotions/${selectedPromotionId}`, 
          'PATCH', 
          {
            promotion: updatedPromotionName,
            installation_amount_id: updatedInstallationAmountId,
            recaptchaToken
          }, 
          token
        );
        alert('Promoción actualizada: ' + result.message);
        setUpdatedPromotionName('');
        setUpdatedInstallationAmountId('');
        setSelectedPromotionId('');
        window.location.reload();
      } catch (error) {
        alert('Error al actualizar la promoción');
      }
    };

    await onSubmitWithRecaptcha(e, submitForm);
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleUpdatePromotion}>
      <div className="comunas-tarifas-field-group">
        <label>Seleccionar Promoción:</label>
        <Select
          className="comunas-tarifas-field"
          value={selectedPromotionId}
          onChange={setSelectedPromotionId}
          options={promotions.map(promotion => ({
            value: promotion.promotion_id,
            label: promotion.promotion
          }))}
          placeholder="Seleccione una promoción"
        />
      </div>
      <div className="comunas-tarifas-field-group">
        <label htmlFor='updatedPromotionName'>Nombre de la Promoción:
          <input
            id="updatedPromotionName"
            name="updatedPromotionName"
            className="comunas-tarifas-field"
            type="text"
            value={updatedPromotionName}
            onChange={(e) => setUpdatedPromotionName(e.target.value)}
            required
          />
        </label>
      </div>
      <div className="comunas-tarifas-field-group">
        <label>Monto de Instalación:</label>
        <Select
          className="comunas-tarifas-field"
          value={updatedInstallationAmountId}
          onChange={setUpdatedInstallationAmountId}
          options={installationAmounts.map(amount => ({
            value: amount.installation_amount_id,
            label: amount.amount
          }))}
          placeholder="Seleccione un monto"
        />
      </div>
      <button className="comunas-tarifas-submit-button" type="submit">
        Actualizar Promoción
      </button>
    </form>
  );  
};

//Deshabilitar
const DisablePromotions = ({ token, regions, promotions }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [communes, setCommunes] = useState([]);
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [selectedPromotionIds, setSelectedPromotionIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedRegionId) {
      // Cargar comunas para la región seleccionada
      apiCall(`${process.env.REACT_APP_API_URL}/communes/communes/${selectedRegionId}`,'GET', null, token)
        .then(setCommunes)
        .catch(error => console.error('Error al cargar comunas:', error));
    }
  }, [selectedRegionId, token]);

  const handleRegionChange = (event) => {
    const regionId = event.target.value; // Obtener el ID de la región seleccionada
    setSelectedRegionId(regionId);  // Actualizar el estado de selectedRegionId
    setSelectedCommuneId('');  // Limpiar la comuna seleccionada al cambiar la región
  };

  const handleCommuneChange = (event) => {
    setSelectedCommuneId(event.target.value); // Obtener el ID de la comuna seleccionada
  };

  const handlePromotionChange = (promotionId, isChecked) => {
    setSelectedPromotionIds((prev) =>
      isChecked ? [...prev, promotionId] : prev.filter((id) => id !== promotionId)
    );
  };

  const handleDisablePromotions = async (e) => {
    e.preventDefault();
    if (selectedPromotionIds.length === 0 || !selectedCommuneId) {
      alert('Debe seleccionar al menos una promoción y una comuna.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await apiCall(`${process.env.REACT_APP_API_URL}/promotions/communes/${selectedCommuneId}/promotions/disable`, 'PATCH', {
        promotionIds: selectedPromotionIds,
      }, token);
      alert(result.message);
      setIsSubmitting(false);
      window.location.reload();
    } catch (error) {
      console.error('Error al deshabilitar promociones:', error);
      alert('Error al deshabilitar promociones');
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleDisablePromotions}>
      <h3 className="comunas-tarifas-header">Seleccionar Región:</h3>
      <select
        className="comunas-tarifas-field"
        value={selectedRegionId}
        onChange={handleRegionChange}
      >
        <option value="">Seleccione una región</option>
        {regions.map((region) => (
          <option key={region.region_id} value={region.region_id}>
            {region.region_name}
          </option>
        ))}
      </select>

      <h3 className="comunas-tarifas-header">Seleccionar Comuna:</h3>
      <select
        className="comunas-tarifas-field"
        value={selectedCommuneId}
        onChange={handleCommuneChange}
      >
        <option value="">Seleccione una comuna</option>
        {/* Ya no es necesario el filtro aquí */}
        {communes.map((commune) => (
          <option key={commune.commune_id} value={commune.commune_id}>
            {commune.commune_name}
          </option>
        ))}
      </select>

      <h3 className="comunas-tarifas-header">Seleccionar Promociones:</h3>
      {promotions.map((promotion) => (
        <div key={promotion.promotion_id} className="comunas-tarifas-field-group">
          <input
            className="comunas-tarifas-field"
            type="checkbox"
            id={`promotion-${promotion.promotion_id}`}
            value={promotion.promotion_id}
            onChange={(e) => handlePromotionChange(promotion.promotion_id, e.target.checked)}
          />
          <label htmlFor={`promotion-${promotion.promotion_id}`} className="comunas-tarifas-field-group">
            {promotion.promotion}
          </label>
        </div>
      ))}

      <button className="comunas-tarifas-submit-button" type="submit" disabled={isSubmitting}>
        Deshabilitar Promociones
      </button>
    </form>
  );
};


const AssignPromotion = ({ token, regions, promotions }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [communes, setCommunes] = useState([]);
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [selectedPromotionIds, setSelectedPromotionIds] = useState([]);

  useEffect(() => {
    if (selectedRegionId) {
      // Cargar las comunas para la región seleccionada
      apiCall(`${process.env.REACT_APP_API_URL}/communes/communes/${selectedRegionId}`,'GET', null, token)
        .then(setCommunes)
        .catch(error => console.error('Error al cargar las comunas:', error));
    } else {
      setCommunes([]); // Limpiar las comunas si no hay región seleccionada
    }
  }, [selectedRegionId, token]);

  const handleRegionChange = (event) => {
    setSelectedRegionId(event.target.value); // Guardar el ID de la región seleccionada
    setSelectedCommuneId(''); // Limpiar la comuna seleccionada
  };

  const handleCommuneChange = (event) => {
    setSelectedCommuneId(event.target.value); // Guardar el ID de la comuna seleccionada
  };

  const handlePromotionChange = (promotionId, isChecked) => {
    setSelectedPromotionIds((prev) =>
      isChecked ? [...prev, promotionId] : prev.filter((id) => id !== promotionId)
    );
  };

  const handleAssignPromotionToCommune = async (e) => {
    e.preventDefault();
    if (selectedPromotionIds.length === 0 || !selectedCommuneId) {
      alert('Debe seleccionar al menos una comuna y una promoción.');
      return;
    }
    try {
      const result = await apiCall(`${process.env.REACT_APP_API_URL}/promotions/communes/${selectedCommuneId}/promotions`, 'POST', {
        promotionIds: selectedPromotionIds,
      }, token);
      alert('Promoción asignada exitosamente:',result.message);
      window.location.reload();
    } catch (error) {
      console.error('Error al asignar la promoción a la comuna:', error);
      alert('Error al asignar la promoción a la comuna');
    }
  };

  return (
    <form onSubmit={handleAssignPromotionToCommune}>
      <h3 className="comunas-tarifas-header">Seleccionar Región:</h3>
      <select
        className="comunas-tarifas-field"
        value={selectedRegionId}
        onChange={handleRegionChange}
      >
        <option value="">Seleccione una región</option>
        {regions.map(region => (
          <option key={region.region_id} value={region.region_id}>
            {region.region_name}
          </option>
        ))}
      </select>

      <h3 className="comunas-tarifas-header">Seleccionar Comuna:</h3>
      <select
        className="comunas-tarifas-field"
        value={selectedCommuneId}
        onChange={handleCommuneChange}
        disabled={!selectedRegionId}
      >
        <option value="">Seleccione una comuna</option>
        {communes.map(commune => (
          <option key={commune.commune_id} value={commune.commune_id}>
            {commune.commune_name}
          </option>
        ))}
      </select>

      <h3 className="comunas-tarifas-header">Seleccionar Promociones:</h3>
      {promotions.map((promotion) => (
        <div key={promotion.promotion_id} className="comunas-tarifas-field-group">
          <input
            className="comunas-tarifas-field"
            type="checkbox"
            id={`promotion-${promotion.promotion_id}`}
            value={promotion.promotion_id}
            onChange={(e) => handlePromotionChange(promotion.promotion_id, e.target.checked)}
          />
          <label htmlFor={`promotion-${promotion.promotion_id}`} className="comunas-tarifas-field-group">
            {promotion.promotion}
          </label>
        </div>
      ))}

      <button className="comunas-tarifas-submit-button" type="submit">
        Asignar Promoción
      </button>
    </form>
  );
};



const UpdateInstallationAmount = ({ token, promotions, installationAmounts }) => {
  const [selectedPromotionId, setSelectedPromotionId] = useState('');
  const [installationAmountId, setInstallationAmountId] = useState('');

  const handlePromotionChange = (promotionId) => {
    setSelectedPromotionId(promotionId);
  };

  const handleInstallationAmountChange = (installationAmountId) => {
    setInstallationAmountId(installationAmountId);
  };

  const handleUpdateInstallationAmount = async (e) => {
    e.preventDefault();
    if (!selectedPromotionId || !installationAmountId) {
      alert('Debe seleccionar una promoción y un monto de instalación.');
      return;
    }
    try {
      const result = await apiCall(`${process.env.REACT_APP_API_URL}/promotions/promotions/${selectedPromotionId}/installation-amount`, 'PATCH', {
        installation_amount_id: installationAmountId,
      }, token);
      alert(result.message);
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar el monto de instalación:', error);
      alert('Error al actualizar el monto de instalación');
    }
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleUpdateInstallationAmount}>
      <div className="comunas-tarifas-field-group">
        <label className="comunas-tarifas-field-group strong">Seleccionar Promoción:</label>
        <Select
          className="comunas-tarifas-field"
          value={selectedPromotionId}
          onChange={handlePromotionChange}
          options={promotions.map(promotion => ({
            value: promotion.promotion_id,
            label: promotion.promotion
          }))}
          placeholder="Seleccione una promoción"
        />
      </div>
      <div className="comunas-tarifas-field-group">
        <label className="comunas-tarifas-field-group strong">Monto de Instalación:</label>
        <Select
          className="comunas-tarifas-field"
          value={installationAmountId}
          onChange={handleInstallationAmountChange}
          options={installationAmounts.map(amount => ({
            value: amount.installation_amount_id,
            label: amount.amount
          }))}
          placeholder="Seleccione un monto"
        />
      </div>
      <button className="comunas-tarifas-submit-button" type="submit">Actualizar Monto</button>
    </form>
  );  
};

// Crear Monto de Instalación
const CreateInstallationAmount = ({ token, onSubmitWithRecaptcha }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!amount) {
      alert('Por favor ingrese un monto.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/promotions/installation-amounts/create`,
          'POST',
          {
            amount,
            recaptchaToken
          },
          token
        );
        alert('Monto de instalación creado: ' + result.message);
        setAmount('');
        window.location.reload();
      } catch (error) {
        alert('Error al crear el monto de instalación');
      }
    };

    await onSubmitWithRecaptcha(event, submitForm);
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleSubmit}>
      <div className="comunas-tarifas-field-group">
        <label htmlFor="amount">
          Monto de Instalación:
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="comunas-tarifas-field"
          />
        </label>
      </div>
      <button type="submit" className="comunas-tarifas-submit-button">
        Crear Monto
      </button>
    </form>
  );
};

// Modificar Monto de Instalación
const ModifyInstallationAmount = ({ token, installationAmounts, onSubmitWithRecaptcha }) => {
  const [selectedAmountId, setSelectedAmountId] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAmountId || !newAmount) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/promotions/installation-amounts/${selectedAmountId}`,
          'PUT',
          {
            amount: newAmount,
            recaptchaToken
          },
          token
        );
        alert('Monto actualizado: ' + result.message);
        setSelectedAmountId('');
        setNewAmount('');
        window.location.reload();
      } catch (error) {
        alert('Error al actualizar el monto');
      }
    };

    await onSubmitWithRecaptcha(event, submitForm);
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleSubmit}>
      <div className="comunas-tarifas-field-group">
        <label>Seleccionar Monto:</label>
        <Select
          value={selectedAmountId}
          onChange={setSelectedAmountId}
          options={installationAmounts.map(amount => ({
            value: amount.installation_amount_id,
            label: amount.amount
          }))}
          placeholder="Seleccione un monto"
        />
      </div>
      <div className="comunas-tarifas-field-group">
        <label>Nuevo Monto:</label>
        <input
          type="text"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          required
          className="comunas-tarifas-field"
        />
      </div>
      <button type="submit" className="comunas-tarifas-submit-button">
        Actualizar Monto
      </button>
    </form>
  );
};

// Habilitar/Deshabilitar Monto de Instalación
const ToggleInstallationAmount = ({ token, installationAmounts }) => {
  const [selectedAmountId, setSelectedAmountId] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedAmountId || isActive === '') {
      alert('Por favor seleccione un monto y especifique el estado.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await apiCall(
        `${process.env.REACT_APP_API_URL}/promotions/installation-amounts/${selectedAmountId}/toggle`,
        'PATCH',
        {
          is_active: isActive === '1'
        },
        token
      );
      alert('Monto actualizado: ' + result.message);
      setSelectedAmountId('');
      setIsActive('');
      setIsSubmitting(false);
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar el monto:', error);
      alert('Error al actualizar el monto');
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleSubmit}>
      <div className="comunas-tarifas-field-group">
        <label>Seleccionar Monto:</label>
        <select
          value={selectedAmountId}
          onChange={(e) => {
            setSelectedAmountId(e.target.value);
          }}
        >
          <option value="">Seleccione un monto</option>
          {installationAmounts.map(amount => (
            <option key={amount.installation_amount_id} value={amount.installation_amount_id}>
              {amount.amount} (Estado: {amount.is_active === 1 ? 'Habilitado' : 'Deshabilitado'})
            </option>
          ))}
        </select>
      </div>
      <div className="comunas-tarifas-field-group">
        <label>Estado:</label>
        <select 
          value={isActive} 
          onChange={(e) => setIsActive(e.target.value)}
        >
          <option value="">Seleccione el estado</option>
          <option value="1">Habilitar</option>
          <option value="0">Deshabilitar</option>
        </select>
      </div>
      <button type="submit" className="comunas-tarifas-submit-button" disabled={isSubmitting}>
        Actualizar Estado
      </button>
    </form>
  );
};

const CreatePromotionWithRecaptcha = withRecaptcha(CreatePromotion, 'create_promotion');
const UpdatePromotionWithRecaptcha = withRecaptcha(UpdatePromotion, 'update_promotion');
const CreateInstallationAmountWithRecaptcha = withRecaptcha(CreateInstallationAmount, 'create_installation_amount');
const ModifyInstallationAmountWithRecaptcha = withRecaptcha(ModifyInstallationAmount, 'modify_installation_amount');

// Main ComunasTarifas component
const Tarifas = () => {
  const { token } = useContext(UserContext);
  const [regions, setRegions] = useState([]);
  const [installationAmounts, setInstallationAmounts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  
  const [isOpenCreatePromotion, toggleCreatePromotion] = useToggleCard();
  const [isOpenUpdatePromotion, toggleUpdatePromotion] = useToggleCard();
  const [isOpenAssignPromotionToCommune, toggleAssignPromotionToCommune] = useToggleCard();
  const [isOpenUpdateInstallationAmount, toggleUpdateInstallationAmount] = useToggleCard();
  const [isOpenDisablePromotions, toggleDisablePromotions] = useToggleCard();
  const [isOpenViewOptions, toggleViewOptions] = useToggleCard();
  const [isOpenCreateInstallationAmount, toggleCreateInstallationAmount] = useToggleCard();
  const [isOpenModifyInstallationAmount, toggleModifyInstallationAmount] = useToggleCard();
  const [isOpenToggleInstallationAmount, toggleToggleInstallationAmount] = useToggleCard();

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [regionsData, installationAmountsData, promotionsData] = await Promise.all([
          apiCall(`${process.env.REACT_APP_API_URL}/regions`,'GET', null, token),
          apiCall(`${process.env.REACT_APP_API_URL}/promotions/installation-amounts`,'GET', null, token),
          apiCall(`${process.env.REACT_APP_API_URL}/promotions`, 'GET', null, token)
        ]);
        setRegions(regionsData);
        setInstallationAmounts(installationAmountsData);
        setPromotions(promotionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className='card-grid'>
      <h1 style={{textAlign: 'center', color: '#99235C'}}>Promociones y Montos de instalación</h1>
      <Card title="Ver Opciones de Promoción e Instalación" isOpen={isOpenViewOptions} toggle={toggleViewOptions}>
        <ViewOptions token={token} regions={regions} />
      </Card>

      <Card title=" Crear Nueva Promoción" isOpen={isOpenCreatePromotion} toggle={toggleCreatePromotion}>
        <CreatePromotionWithRecaptcha token={token} installationAmounts={installationAmounts} />
      </Card>

      <Card title="Actualizar Nombre Promoción" isOpen={isOpenUpdatePromotion} toggle={toggleUpdatePromotion}>
        <UpdatePromotionWithRecaptcha token={token} promotions={promotions} installationAmounts={installationAmounts} />
      </Card>

      <Card title="Deshabilitar Promocione(s)" isOpen={isOpenDisablePromotions} toggle={toggleDisablePromotions}>
        <DisablePromotions
          token={token}
          regions={regions}
          promotions={promotions}
        />
      </Card>

      <Card title="Asignar Promoción a Comuna" isOpen={isOpenAssignPromotionToCommune} toggle={toggleAssignPromotionToCommune}>
        <AssignPromotion
          token={token}
          regions={regions}
          promotions={promotions}
        />
      </Card>

      <Card title="Asignar Monto de Instalación a Promoción" isOpen={isOpenUpdateInstallationAmount} toggle={toggleUpdateInstallationAmount}>
        <UpdateInstallationAmount token={token} promotions={promotions} installationAmounts={installationAmounts} />
      </Card>

      <Card title="Crear Monto de Instalación" isOpen={isOpenCreateInstallationAmount} toggle={toggleCreateInstallationAmount}>
        <CreateInstallationAmountWithRecaptcha token={token} />
      </Card>

      <Card title="Modificar Monto de Instalación" isOpen={isOpenModifyInstallationAmount} toggle={toggleModifyInstallationAmount}>
        <ModifyInstallationAmountWithRecaptcha token={token} installationAmounts={installationAmounts} />
      </Card>

      <Card title="Habilitar/Deshabilitar Monto de Instalación" isOpen={isOpenToggleInstallationAmount} toggle={toggleToggleInstallationAmount}>
        <ToggleInstallationAmount token={token} installationAmounts={installationAmounts} />
      </Card>
    </div>
  );
};


export default Tarifas;