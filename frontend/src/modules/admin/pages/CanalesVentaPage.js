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

// Card component
const Card = ({ title, children, isOpen, toggle }) => (
  <div className="card" onClick={toggle}>
    <h2>{title}</h2>
    {isOpen && <div onClick={(e) => e.stopPropagation()}>{children}</div>}
  </div>
);

//Obtener canales de venta
const ObtenerCanalesDeVenta = ({ channels }) => {
  const [selectedChannel, setSelectedChannel] = useState('');
  const handleChannelChange = (e) => {
    setSelectedChannel(e.target.value);
  };

  return (
    <select value={selectedChannel} onChange={handleChannelChange}>
      <option value="">Seleccione un canal de venta</option>
      {channels.map((channel) => (
        <option key={channel.sales_channel_id} value={channel.sales_channel_id}>
          {channel.channel_name}
        </option>
      ))}
    </select>
  );
};

const CrearCanalDeVenta = ({ token, onSubmitWithRecaptcha  }) => {
  const [channelName, setChannelName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChannelNameChange = (e) => {
    setChannelName(e.target.value);
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      setIsSubmitting(true);
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/channels/create`,
          'POST',
          {
            salesChannelName: channelName,
            recaptchaToken
          },
          token
        );
        alert(result.message);
        setIsSubmitting(false);
        window.location.reload();
      } catch (error) {
        console.error('Error al crear canal de venta:', error);
        alert(error.message);
        setIsSubmitting(false);
      }
    };

    await onSubmitWithRecaptcha(e, submitForm);
  };

  return (
    <form className="comunas-tarifas-field-group" onSubmit={handleCreateChannel}>
      <h3>Crear Canal de Venta</h3>
      <input type="text" value={channelName} onChange={handleChannelNameChange} placeholder="Nombre del canal de venta"/>
      <button type="submit" disabled={isSubmitting}>Crear Canal de Venta</button>
    </form>
  );
};

//Actualizar canal de venta
const ActualizarCanalDeVenta = ({ token, onSubmitWithRecaptcha }) => {
  const [selectedChannel, setSelectedChannel] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const result = await apiCall(`${process.env.REACT_APP_API_URL}/channels/all`, 'GET', null, token);
        setChannels(result);
      } catch (error) {
        console.error('Error al obtener canales de venta:', error);
        alert('Error al obtener canales de venta');
      }
    };

    fetchChannels();
  }, [token]);

  const handleChannelChange = (e) => {
    setSelectedChannel(e.target.value);
  };

  const handleChannelNameChange = (e) => {
    setNewChannelName(e.target.value);
  };

  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    if (!selectedChannel || !newChannelName) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      setIsSubmitting(true);
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/channels/${selectedChannel}`,
          'PUT',
          {
            salesChannelName: newChannelName,
            recaptchaToken
          },
          token
        );
        alert(result.message);
        setIsSubmitting(false);
        window.location.reload();
      } catch ( error) {
        console.error('Error al actualizar canal de venta:', error);
        alert(error.message);
        setIsSubmitting(false);
      }
    };

    await onSubmitWithRecaptcha(e, submitForm);
  };

  return (
    <form className="comunas-tarifas-field-group" onSubmit={handleUpdateChannel}>
      <h3>Actualizar Canal de Venta</h3>
      <select value={selectedChannel} onChange={handleChannelChange}>
        <option value="">Seleccione un canal de venta</option>
        {channels.map((channel) => (
          <option key={channel.sales_channel_id} value={channel.sales_channel_id}>
            {channel.channel_name}
          </option>
        ))}
      </select>
      <input type="text" value={newChannelName} onChange={handleChannelNameChange} placeholder="Nuevo nombre del canal"/>
      <button type="submit" disabled={isSubmitting}>Actualizar Canal de Venta</button>
    </form>
  );
};


// Habilitar/Deshabilitar canal de venta
const ToggleCanalDeVentaStatus = ({ token }) => {
  const [channels, setChannels] = useState([]); // Para almacenar los canales de venta
  const [selectedChannel, setSelectedChannel] = useState('');
  const [channelStatus, setChannelStatus] = useState(''); // Para almacenar el estado seleccionado (1 o 0)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para obtener los canales de venta desde el endpoint correcto
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const channelsData = await apiCall( `${process.env.REACT_APP_API_URL}/channels/all`, 'GET', null, token);
        setChannels(channelsData);
      } catch (error) {
        console.error('Error al obtener los canales de venta:', error);
      }
    };

    if (token) {
      fetchChannels();
    }
  }, [token]);

  // Maneja el cambio de canal seleccionado
  const handleChannelChange = (e) => {
    setSelectedChannel(e.target.value);
  };

  // Maneja el cambio de estado (habilitado/deshabilitado)
  const handleStatusChange = (e) => {
    setChannelStatus(e.target.value);
  };

  // Maneja la acción de habilitar/deshabilitar el canal
  const handleToggleStatus = async (e) => {
    e.preventDefault();
    if (!selectedChannel || channelStatus === '') {
      alert('Por favor seleccione un canal y su estado.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await apiCall(
        `${process.env.REACT_APP_API_URL}/channels/${selectedChannel}/toggle-status`,
        'PUT',
        { is_active: parseInt(channelStatus) }, // Enviar 1 o 0 según la selección
        token
      );
      alert(result.message);
      setIsSubmitting(false);
      window.location.reload(); // Recargar la página tras el cambio
    } catch (error) {
      console.error('Error al habilitar/deshabilitar canal de venta:', error);
      alert(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comunas-tarifas-field-group" onSubmit={handleToggleStatus}>
      <h3>Habilitar/Deshabilitar Canal de Venta</h3>

      {/* Select para seleccionar el canal */}
      <select value={selectedChannel} onChange={handleChannelChange}>
        <option value="">Seleccione un canal de venta</option>
        {channels.map((channel) => (
          <option key={channel.sales_channel_id} value={channel.sales_channel_id}>
            {channel.channel_name} ({channel.is_active ? 'Habilitado' : 'Deshabilitado'})
          </option>
        ))}
      </select>

      {/* Select para seleccionar el estado (habilitado/deshabilitado) */}
      <select value={channelStatus} onChange={handleStatusChange}>
        <option value="">Seleccione estado</option>
        <option value="1">Habilitado</option>
        <option value="0">Deshabilitado</option>
      </select>

      <button type="submit" disabled={isSubmitting}>
        Habilitar/Deshabilitar Canal
      </button>
    </form>
  );
};

const CrearCanalDeVentaWithRecaptcha = withRecaptcha(CrearCanalDeVenta, 'create_channel');
const ActualizarCanalDeVentaWithRecaptcha = withRecaptcha(ActualizarCanalDeVenta, 'update_channel');

// Main component
const CanalesDeVenta = () => {
  const { token } = useContext(UserContext);
  const [isOpenObtenerCanalesDeVenta, toggleObtenerCanalesDeVenta] = useToggleCard();
  const [channels, setChannels] = useState([]);
  const [isOpenCrearCanalDeVenta, toggleCrearCanalDeVenta] = useToggleCard();
  const [isOpenUpdateChannel, toggleUpdateChannel] = useToggleCard();
  const [isOpenToggleChannelStatus, toggleToggleChannelStatus] = useToggleCard();


  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [channelsData] = await Promise.all([
          apiCall( `${process.env.REACT_APP_API_URL}/channels`, 'GET', null, token)
        ]);
        setChannels(channelsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className='card-grid'>
      <h1 style={{textAlign: 'center', color: '#99235C'}}>Canales de Venta</h1>
      <Card title="Obtener Canales de Venta" isOpen={isOpenObtenerCanalesDeVenta} toggle={toggleObtenerCanalesDeVenta}  className="card-obtener-canales-de-venta">
        <ObtenerCanalesDeVenta token={token} channels={channels} />
      </Card>

      <Card title="Crear Canal de Venta" isOpen={isOpenCrearCanalDeVenta} toggle={toggleCrearCanalDeVenta}>
        <CrearCanalDeVentaWithRecaptcha token={token} />
      </Card>

      <Card title="Actualizar Canal de Venta" isOpen={isOpenUpdateChannel} toggle={toggleUpdateChannel}>
        <ActualizarCanalDeVentaWithRecaptcha token={token} channels={channels} />
      </Card>

      <Card title="Habilitar/Deshabilitar Canal de Venta" isOpen={isOpenToggleChannelStatus} toggle={toggleToggleChannelStatus}>
        <ToggleCanalDeVentaStatus token={token} channels={channels} />
      </Card>

    </div>
  );
};


export default CanalesDeVenta;