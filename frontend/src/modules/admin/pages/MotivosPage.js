import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import withRecaptcha from '../../../HOC/withRecaptcha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Motivos.css';

const TablaMotivos = ({ onSubmitWithRecaptcha }) => {
  const { token } = useContext(UserContext);
  const [statusesWithReasons, setStatusesWithReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentReason, setCurrentReason] = useState({});

  useEffect(() => {
    fetchStatusesWithReasons();
  }, [token]);

  const fetchStatusesWithReasons = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sale-statuses/reasons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('El servidor no responde');
      }
      const data = await response.json();
      setStatusesWithReasons(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      alert(`Error: ${error.message}`);
    }
  };

  const handleAddReason = (statusId) => {
    setCurrentReason({ sale_status_id: statusId, reason_name: '', is_active: true });
    setShowModal(true);
  };

  const handleEditReason = (reason, statusId) => {
    setCurrentReason({
      ...reason,
      sale_status_id: statusId
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSaveReason = async (e, recaptchaToken) => {
    e.preventDefault();
    try {
      const payload = {
        reason_name: currentReason.reason_name,
        is_active: currentReason.is_active,
        sale_status_id: currentReason.sale_status_id,
        recaptchaToken: recaptchaToken // Agregar el token
      };
  
      if (currentReason.sale_status_reason_id) {
        payload.sale_status_reason_id = currentReason.sale_status_reason_id;
      }
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sale-statuses/reasons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar el motivo');
      }
  
      await fetchStatusesWithReasons();
      setShowModal(false);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="tabla-motivos">
      <h1>Estados de Venta y Motivos</h1>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Estado</th>
              <th>Motivos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {statusesWithReasons.slice(1).map((status) => (
              <tr key={status.sale_status_id}>
                <td>{status.status_name}</td>
                <td>
                  <ul>
                    {status.saleStatusReasons.map((reason) => (
                      <li key={reason.sale_status_reason_id}>
                        {reason.reason_name}
                        <span className={`status-badge ${reason.is_active ? 'active' : 'inactive'}`}>
                          {reason.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        <button 
                            onClick={() => handleEditReason(reason, status.sale_status_id)}
                            className="edit-button"
                        >
                            <FontAwesomeIcon icon={faEdit} /> Editar
                        </button>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  <button 
                    onClick={() => handleAddReason(status.sale_status_id)}
                    className="add-button"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Agregar Motivo
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{currentReason.sale_status_reason_id ? 'Editar Motivo' : 'Agregar Motivo'}</h2>
              <button onClick={handleCloseModal} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={(e) => onSubmitWithRecaptcha(e, handleSaveReason)}>
              <label>Nombre del Motivo:</label>
              <input 
                type="text" 
                name='reason_name'
                id='reason_name'
                value={currentReason.reason_name} 
                onChange={(e) => setCurrentReason({ ...currentReason, reason_name: e.target.value })} 
              />
              <div className="checkbox-container">
                <label>
                  <input 
                    type="checkbox" 
                    checked={currentReason.is_active} 
                    onChange={(e) => setCurrentReason({ ...currentReason, is_active: e. target.checked })} 
                  />
                  Activo
                </label>
              </div>
              <div className="button-container">
                <button type="submit" className="save-button">Guardar</button>
                <button type="button" onClick={handleCloseModal} className="cancel-button">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default withRecaptcha(TablaMotivos, 'save_reason');