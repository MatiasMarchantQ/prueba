import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import './ComunasTarifas.css';
import withRecaptcha from '../../../HOC/withRecaptcha';

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
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Error de autenticación');
    } else {
      throw new Error('Fallo en la solicitud');
    }
  }
  return response.json();
};

const useToggleCard = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const toggle = () => setIsOpen(prev => !prev);
  return [isOpen, toggle];
};

const Card = ({ title, children, isOpen, toggle }) => (
  <div className="card" onClick={toggle}>
    <h2>{title}</h2>
    {isOpen && <div onClick={(e) => e.stopPropagation()}>{children}</div>}
  </div>
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

// AddCommuneToRegion component
const AddCommuneToRegion = ({ token, regions, onSubmitWithRecaptcha  }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [communeName, setCommuneName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegionChange = (regionId) => {
    setSelectedRegionId(regionId);
  };

  const handleCommuneNameChange = (e) => {
    setCommuneName(e.target.value);
  };

  const handleAddCommuneToRegion = async (e) => {
    e.preventDefault();
    if (!communeName || !selectedRegionId) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      setIsSubmitting(true);
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/communes/regions/${selectedRegionId}/communes`, 
          'POST', 
          {
            commune_name: communeName,
            recaptchaToken
          }, 
          token
        );
        alert(result.message);
        setCommuneName('');
        setIsSubmitting(false);
        window.location.reload();
      } catch (error) {
        console.error('Error al agregar la comuna a la región:', error);
        alert('Error al agregar comuna a la región');
        setIsSubmitting(false);
      }
    };

    await onSubmitWithRecaptcha(e, submitForm);
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleAddCommuneToRegion}>
      <h3>Seleccionar Región:</h3>
      <select value={selectedRegionId} onChange={(e) => handleRegionChange(e.target.value)} className="comunas-tarifas-select">
        <option value="">Seleccione una región</option>
        {regions.map((region) => (
          <option key={region.region_id} value={region.region_id}>{region.region_name}</option>
        ))}
      </select>

      <div className="comunas-tarifas-field-group">
        <label htmlFor='communeName'>Nombre de la Comuna:
          <input
            id="communeName"
            name="communeName"
            type="text"
            value={communeName}
            onChange={handleCommuneNameChange}
            required
          />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="comunas-tarifas-submit-button">Agregar Comuna</button>
    </form>
  );
};

const UpdateCommune = ({ token, regions, onSubmitWithRecaptcha }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [communes, setCommunes] = useState([]);
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [communeName, setCommuneName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedRegionId) {
      apiCall(`${process.env.REACT_APP_API_URL}/communes/region/${selectedRegionId}`,'GET', null, token)
        .then(setCommunes)
        .catch(error => console.error('Error cargando comunas:', error));
    }
  }, [selectedRegionId, token]);

  const handleRegionChange = (regionId) => {
    setSelectedRegionId(regionId);
    setSelectedCommuneId('');
  };

  const handleCommuneChange = (communeId) => {
    setSelectedCommuneId(communeId);
  };

  const handleCommuneNameChange = (e) => {
    setCommuneName(e.target.value);
  };

  const handleUpdateCommune = async (e) => {
    e.preventDefault();
    if (!communeName || !selectedCommuneId) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      setIsSubmitting(true);
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/communes/${selectedCommuneId}`, 
          'PUT', 
          {
            commune_name: communeName,
            recaptchaToken
          }, 
          token
        );
        alert(result.message);
        setCommuneName('');
        setIsSubmitting(false);
        window.location.reload();
      } catch (error) {
        console.error('Error updating commune:', error);
        alert('Error al actualizar la comuna');
        setIsSubmitting(false);
      }
    };

    await onSubmitWithRecaptcha(e, submitForm);
  };

  return (
    <form className="comunas-tarifas-form" onSubmit={handleUpdateCommune}>
      <h3>Seleccionar Región:</h3>
      <select value={selectedRegionId} onChange={(e) => handleRegionChange(e.target.value)} className="comunas-tarifas-select">
        <option value="">Seleccione una región</option>
        {regions.map((region) => (
          <option key={region.region_id} value={region.region_id}>{region.region_name}</option>
        ))}
      </select>

      <h3>Seleccionar Comuna:</h3>
      <select value={selectedCommuneId} onChange={(e) => handleCommuneChange(e.target.value)} className="comunas-tarifas-select">
        <option value="">Seleccione una comuna</option>
        {communes.map((commune) => (
          <option key={commune.commune_id} value={commune.commune_id}>
            {commune.commune_name} ({commune.is_active ? 'Habilitada' : 'Deshabilitada'})
          </option>
        ))}
      </select>

      <div className="comunas-tarifas-field-group">
        <label htmlFor='communeName'>Nombre de la Comuna:
          <input
            id="communeName"
            name="communeName"
            type="text"
            value={communeName}
            onChange={handleCommuneNameChange}
            required
          />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="comunas-tarifas-submit-button">Actualizar Comuna</button>
    </form>
  );
};

const ToggleCommuneStatus = ({ token, regions }) => {
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [communes, setCommunes] = useState([]);
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedRegionId) {
      apiCall(`${process.env.REACT_APP_API_URL}/communes/region/${selectedRegionId}`,'GET', null, token)
        .then(setCommunes)
        .catch(error => console.error('Error cargando comunas:', error));
    }
  }, [selectedRegionId, token]);

  const handleRegionChange = (regionId) => {
    setSelectedRegionId(regionId);
    setSelectedCommuneId('');
  };

  const handleCommuneChange = (communeId) => {
    setSelectedCommuneId(communeId);
  };

  const handleToggleStatus = async () => {
    setIsSubmitting(true);
    try {
      const result = await apiCall(`${process.env.REACT_APP_API_URL}/communes/${selectedCommuneId}/toggle-status`, 'PATCH', {
        isActive
      }, token);
      alert(result.message);
      setIsSubmitting(false);
      window.location.reload();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la comuna');
      setIsSubmitting(false);
    }
  };

  return (
    <form>
      <h3>Seleccionar Región:</h3>
      <select value={selectedRegionId} onChange={(e) => handleRegionChange(e.target.value)} className="comunas-tarifas-select">
        <option value="">Seleccione una región</option>
        {regions.map((region) => (
          <option key={region.region_id} value={region.region_id}>{region.region_name}</option>
        ))}
      </select>

      <h3>Seleccionar Comuna:</h3>
      <select value={selectedCommuneId} onChange={(e) => handleCommuneChange(e.target.value)} className="comunas-tarifas-select">
        <option value="">Seleccione una comuna</option>
        {communes.map((commune) => (
          <option key={commune.commune_id} value={commune.commune_id}>
            {commune.commune_name} ({commune.is_active ? 'Habilitada' : 'Deshabilitada'})
          </option>
        ))}
      </select>

      <h3>Habilitar/Deshabilitar:</h3>
      <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="comunas-tarifas-select">
      <option value="">Seleccione un estado</option>
        <option value="1">Habilitado</option>
        <option value="0">Deshabilitado</option>
      </select>

      <button type="button" onClick={handleToggleStatus} disabled={isSubmitting}>Cambiar Estado</button>
    </form>
  );
};

// Envolver los componentes con withRecaptcha y exportarlos
const AddCommuneToRegionWithRecaptcha = withRecaptcha(AddCommuneToRegion, 'add_commune_action');
const UpdateCommuneWithRecaptcha = withRecaptcha(UpdateCommune, 'update_commune_action');


// Main ComunasTarifas component
const Comunas = () => {
  const { token } = useContext(UserContext);
  const [regions, setRegions] = useState([]);
  const [installationAmounts, setInstallationAmounts] = useState([]);
  const [isOpenAddCommuneToRegion, toggleAddCommuneToRegion] = useToggleCard();
  const [isOpenUpdateCommune, toggleUpdateCommune] = useToggleCard();
  const [isOpenViewOptions, toggleViewOptions] = useToggleCard();
  const [isOpenToggleCommuneStatus, toggleToggleCommuneStatus] = useToggleCard();

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [regionsData, installationAmountsData] = await Promise.all([
          apiCall(`${process.env.REACT_APP_API_URL}/regions`,'GET', null, token),
          apiCall(`${process.env.REACT_APP_API_URL}/promotions/installation-amounts`,'GET', null, token),
          apiCall(`${process.env.REACT_APP_API_URL}/promotions`, 'GET', null, token)
        ]);
        setRegions(regionsData);
        setInstallationAmounts(installationAmountsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [token, setInstallationAmounts]);

  return (
    <div className='card-grid'>
      <h1 style={{textAlign: 'center', color: '#99235C'}}>Comunas</h1>
      <Card title="Ver Opciones de Promoción e Instalación" isOpen={isOpenViewOptions} toggle={toggleViewOptions}>
        <ViewOptions token={token} regions={regions} />
      </Card>

      <Card title="Agregar Comuna a Región" isOpen={isOpenAddCommuneToRegion} toggle={toggleAddCommuneToRegion}>
        <AddCommuneToRegionWithRecaptcha token={token} regions={regions} />
      </Card>

      <Card title="Actualizar Comuna" isOpen={isOpenUpdateCommune} toggle={toggleUpdateCommune}>
        <UpdateCommuneWithRecaptcha token={token} regions={regions} />
      </Card>

      <Card title="Habilitar/Deshabilitar Comuna" isOpen={isOpenToggleCommuneStatus} toggle={toggleToggleCommuneStatus}>
        <ToggleCommuneStatus token={token} regions={regions} />
      </Card>
    </div>
  );
};


export default Comunas;