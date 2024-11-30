import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import withAuthorization from '../../../contexts/withAuthorization';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import './TablaDatos.css';

const TablaDatosPage = ({ onCommuneClick }) => {
  const { token } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [regionId, setRegionId] = useState('');
  const [communeId, setCommuneId] = useState('');
  const [promotionId, setPromotionId] = useState('');
  const [installationAmountId, setInstallationAmountId] = useState('');
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [installationAmounts, setInstallationAmounts] = useState([]);
  const limit = 4;

  useEffect(() => {
    fetchData();
  }, [token, currentPage, regionId, communeId, promotionId, installationAmountId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        region_id: regionId,
        commune_id: communeId,
        promotion_id: promotionId,
        installation_amount_id: installationAmountId
      });
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}/promotions/all?${params.toString()}`, { headers });
      const jsonData = await response.json();
      
      setData(jsonData.data);
      setTotalPages(jsonData.pagination.totalPages);
      setTotalItems(jsonData.pagination.total);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        const response = await fetch(`${process.env.REACT_APP_API_URL}/regions`, { headers });
        const jsonData = await response.json();
        setRegions(jsonData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRegions();
  }, [token]);

  useEffect(() => {
    const fetchCommunes = async () => {
      if (regionId) {
        try {
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          const response = await fetch(`${process.env.REACT_APP_API_URL}/communes/region/${regionId}`, { headers });
          const jsonData = await response.json();
          setCommunes(Array.isArray(jsonData) ? jsonData : []);
        } catch (error) {
          console.error('Error fetching communes:', error);
          setCommunes([]);
        }
      } else {
        setCommunes([]);
      }
    };
    fetchCommunes();
  }, [regionId, token]);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        const response = await fetch(`${process.env.REACT_APP_API_URL}/promotions`, { headers });
        const jsonData = await response.json();
        setPromotions(jsonData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchPromotions();
  }, [token]);

  useEffect(() => {
    const fetchInstallationAmounts = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        const response = await fetch(`${process.env.REACT_APP_API_URL}/promotions/installation-amounts`, { headers });
        const jsonData = await response.json();
        setInstallationAmounts(jsonData);
      } catch (error) {
        console.error(error);
      }
    };
    fetchInstallationAmounts();
  }, [token]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
 
  const handleRegionChange = (event) => {
    const newRegionId = event.target.value;
    setRegionId(newRegionId);
    setCommuneId(''); // Resetear la comuna seleccionada
    setCurrentPage(1);
    
    // Si la nueva región no tiene comunas, actualizar el estado de las comunas
    if (newRegionId && regions.find(r => r.region_id.toString() === newRegionId)?.communes?.length === 0) {
      setCommunes([]);
    }
  };

  const handleCommuneChange = (event) => {
    setCommuneId(event.target.value);
    setCurrentPage(1);
  };

  const handlePromotionChange = (event) => {
    setPromotionId(event.target.value);
    setCurrentPage(1);
  };

  const handleInstallationAmountChange = (event) => {
    setInstallationAmountId(event.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setRegionId('');
    setCommuneId('');
    setPromotionId('');
    setInstallationAmountId('');
    setCurrentPage(1);
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <div className='tabla-datos-filter'>
        <h1 style={{ color: '#99235C', textAlign: 'center' }}>Promociones Internet por Zona</h1>
        <div className="filters">
          <label>Región:</label>
          <select id='region-select' name='region' value={regionId} onChange={handleRegionChange}>
            <option value="">Todas las regiones</option>
            {regions.map((region) => (
              <option key={region.region_id} value={region.region_id}>
                {region.region_name}
              </option>
            ))}
          </select>
    
          <label>Comuna:</label>
          <select id='commune-select' name='commune' value={communeId} onChange={handleCommuneChange} disabled={!Array.isArray(communes) || communes.length === 0}>
            <option value="">
              {!Array.isArray(communes) || communes.length === 0 ? "No hay comunas disponibles" : "Todas las comunas"}
            </option>
            {Array.isArray(communes) && communes.map((commune) => (
              <option key={commune.commune_id} value={commune.commune_id}>
                {commune.commune_name}
              </option>
            ))}
          </select>
    
          <label>Promoción:</label>
          <select id='promotion-select' name='promotion' value={promotionId} onChange={handlePromotionChange}>
            <option value="">Todas las promociones</option>
            {promotions.map((promotion) => (
              <option key={promotion.promotion_id} value={promotion.promotion_id}>
                {promotion.promotion}
              </option>
            ))}
          </select>
    
          <label>Monto Instalación:</label>
          <select id='installation-amount-select' name='installationAmount' value={installationAmountId} onChange={handleInstallationAmountChange}>
            <option value="">Todas las instalaciones</option>
            {installationAmounts.map((installationAmount) => (
              <option key={installationAmount.installation_amount_id} value={installationAmount.installation_amount_id}>
                {installationAmount.amount}
              </option>
            ))}
          </select>          
          <button onClick={handleClearFilters}>Limpiar filtros</button>
        </div>
      </div>
  
      <div className="tabla-datos">
        <table>
          <thead>
            <tr>
              <th>Región</th>
              <th>Comuna</th>
              <th>Estado Comuna</th>
              <th>Promoción</th>
              <th>Monto de instalación</th>
              <th>Estado promoción</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
          {data ? (
            data.flatMap((region) => {
              if (region.communes.length === 0) {
                return (
                  <tr key={region.region_id}>
                    <td>{region.region_name}</td>
                    <td colSpan="6">No hay comunas asociadas a esta región</td>
                  </tr>
                );
              }
              return region.communes.map((commune) => {
                if (commune.promotions.length === 0) {
                  return (
                    <tr key={`${region.region_id}-${commune.commune_id}`}>
                      <td>{region.region_name}</td>
                      <td>{commune.commune_name}</td>
                      <td>
                        <span className={`status-badge ${commune.is_active ? 'active' : 'inactive'}`}>
                          {commune.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td colSpan="3">Sin promoción asignada</td>
                      <td>
                        <button 
                          onClick={() => onCommuneClick(commune.commune_id)}
                          className="edit-button"
                        >
                          <FontAwesomeIcon icon={faEdit} /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                } else {
                  return commune.promotions.map((promotion) => (
                    <tr key={`${region.region_id}-${commune.commune_id}-${promotion.promotion_id}`}>
                      <td>{region.region_name}</td>
                      <td>{commune.commune_name}</td>
                      <td>
                        <span className={`status-badge ${commune.is_active ? 'active' : 'inactive'}`}>
                          {commune.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{promotion.promotion}</td>
                      <td>{promotion.installation_amount}</td>
                      <td>
                        <span className={`status-badge ${promotion.is_active === 1 ? 'active' : 'inactive'}`}>
                          {promotion.is_active === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => onCommuneClick(commune.commune_id)}
                          className="edit-button"
                          style={{
                            backgroundColor: '#99235C',
                            color: '#ffffff',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} /> Editar
                        </button>
                      </td>
                    </tr>
                  ));
                }
              });
            })
          ) : (
            <tr>
              <td colSpan="7">Cargando...</td>
            </tr>
          )}
          </tbody>
        </table>
  
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
  
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
  
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
};  

export default TablaDatosPage;