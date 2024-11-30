import React, { useContext, useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar  } from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '../../../contexts/UserContext'; // Asegúrate de que la ruta sea correcta

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Crear un objeto Date a partir del string ISO
    const date = new Date(dateString);
    
    // Obtener los componentes de la fecha y hora en UTC
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return dateString;
  }
};

const SaleCard = ({ sale, onSaleClick, getStatusColor, onPriorityChange, refreshSales }) => {
  const { token, roleId } = useContext(UserContext);
  const [localPriority, setLocalPriority] = useState(sale.is_priority);
  const [saleHistory, setSaleHistory] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const getSaleHistory = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/history/${sale.sale_id}`);
      if (!response.ok) {
        throw new Error('Failed to get sale history');
      }
      const history = await response.json();
      setSaleHistory(history);
    } catch (error) {
      console.error('Error getting sale history:', error);
    }
  }, [sale.sale_id]);
  
  useEffect(() => {
    getSaleHistory();
  }, [sale.sale_id, getSaleHistory]);

  const handlePriorityToggle = async (e) => {
    e.stopPropagation();
    if (roleId !== 1 && roleId !== 2) return;
  
    try {
      const newPriority = localPriority === 1 ? 0 : 1;
      setLocalPriority(newPriority); // Actualiza inmediatamente el estado local
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/update-priority/${sale.sale_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_priority: newPriority }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update priority');
      }
  
      const updatedSale = await response.json();
      onPriorityChange(updatedSale);
      refreshSales();
    } catch (error) {
      console.error('Error updating priority:', error);
      setLocalPriority(sale.is_priority);
    }
  };

  const handleShowHistoryModal = () => {
    setShowHistoryModal(true);
    document.body.classList.add('modal-open');
  };

  const handleHideHistoryModal = () => {
    setShowHistoryModal(false);
    document.body.classList.remove('modal-open');
  };
  
  return (
    <div className="sale-card" onClick={() => onSaleClick(sale.sale_id)} style={{ position: 'relative' }}>
      {(roleId === 1 || roleId === 2) && sale.sale_status_id !== 6 && (
        <div 
          style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            cursor: 'pointer',
            zIndex: 1
          }}
          onClick={handlePriorityToggle}
        >
          <FontAwesomeIcon 
            icon={faStar} 
            style={{ 
              color: localPriority === 1 ? 'gold' : 'gray',
              fontSize: '20px'
            }} 
          />
        </div>
      )}
      <div className="sale-card-header">
        <div>
          <p className="sale-status" style={{ 
            width: 100,
            padding: 5, 
            backgroundColor: getStatusColor(sale.sale_status_id), 
            borderRadius: 5, 
            textAlign: 'center' 
          }}>
            {sale.saleStatus ? sale.saleStatus.status_name : 'Estado no disponible'}
          </p>
          {sale.reason?.reason_name && (
            <p className='reason-status' style={{textAlign: 'center'}}>
              <span className="info-item gray" style={{ width: 100 ,fontSize: '12px'}}>
                {`Motivo: ${sale.reason.reason_name}`}
              </span>
            </p>
          )}
        </div>
        <div className="sale-info">
          <div className="info-top">
            {sale.service_id && <p className="info-item purple">{`ID Wisphub: ${sale.service_id}`}</p>}
            {sale.client_first_name && sale.client_last_name && (
              <p className="info-item purple">{`Cliente: ${sale.client_first_name} ${sale.client_last_name}`}</p>
            )}
            {sale.client_rut && <p className="info-item purple">{`${sale.client_rut}`}</p>}
            {sale.client_phone && <p className="info-item purple">{`${sale.client_phone}`}</p>}
          </div>
          <div className="info-bottom">
            {sale.company?.company_name && <p className="info-item gray">{`${ sale.company?.company_name}`}</p>}
            {sale.created_at && (
              <p className="info-item gray">
                Ingresada: {(() => {
                  const date = sale.created_at.split('T')[0].split('-');
                  const time = sale.created_at.split('T')[1].split('.')[0];
                  return `${date[2]}-${date[1]}-${date[0]}, ${time}`;
                })()}
              </p>
            )}
            {sale.client_email && <p className="info-item gray">{sale.client_email}</p>}
            {sale.region?.region_name && <p className="info-item gray">{`Región: ${sale.region.region_name}`}</p>}
            {sale.commune?.commune_name && <p className="info-item gray">{`Comuna: ${sale.commune.commune_name}`}</p>}
            {sale.street && sale.number && (
              <p className="info-item gray">
                {`${sale.street} ${sale.number}${sale.department_office_floor ? ` ${sale.department_office_floor}` : ''}`}
              </p>
            )}
            {sale.additional_comments && (
              <p className="info-item gray">{`Comentarios adicionales: ${sale.additional_comments}`}</p>
            )}
            {sale.Company?.company_name && <p className="info-item gray">{sale.Company?.company_name}</p>}
          </div>
          <div className="sale-history" style={{ position: 'absolute', bottom: 0, right: 15, fontSize: '0.9rem' }}>
            {saleHistory && saleHistory.history.filter((history) => history.eventType !== "Prioridad").slice(-1).map((history) => (
              <div key={0}>
                <p className="info-item gray">
                  Se actualizó el {formatDateTime(history.date)} por {history.user}
                </p>
                <button className="button-ver-mas" onClick={(e) => {
                  e.stopPropagation();
                  handleShowHistoryModal();
                }}>Ver más</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showHistoryModal && (
        <div className="history-modal" onClick={(e) => e.stopPropagation()}>
          <div className="history-modal-content">
            <h2>Historial completo</h2>
            <div className="scrollable-content">
              <ul>
                {saleHistory.history.map((history, index) => (
                  <li key={history.id}>
                    <p>
                      El {formatDateTime(history.date)}
                      {index === 0 && (
                        <span>
                          {' se ingresó'}
                        </span>
                      )}
                      {history.eventType === "Prioridad" && (
                        <span>
                          {' se cambió por '}
                          <span style={{ fontStyle: 'italic', color: 'orange' }}>
                            Prioridad
                          </span>
                          {' por '}
                          {history.priorityModifiedBy}
                        </span>
                      )}
                      {history.eventType !== "Prioridad" && (
                        <span>
                          {history.previousStatus && history.newStatus && (
                            <span>
                              {' se actualizó de '}
                              <span style={{ textDecoration: 'line-through' }}>
                                {history.previousStatus}
                              </span>
                              {' a '}
                              <span style={{ color: 'green' }}>
                                {history.newStatus}
                              </span>
                            </span>
                          )}
                          {history.reason && (
                            <span>
                              {' por el motivo '}
                              <span style={{ fontStyle: 'italic' }}>
                                {history.reason}
                              </span>
                            </span>
                          )}
                          {' por '}
                          {history.eventType === "Prioridad" ? history.priorityModifiedBy : history.user}
                        </span>
                      )}
                      {history.additional_comments && (
                        <span>
                          <br />
                          <span>
                            Comentario adicional: {history.additional_comments}
                          </span>
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
              <button onClick={(e) => {
                e.stopPropagation();
                handleHideHistoryModal();
              }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleCard;