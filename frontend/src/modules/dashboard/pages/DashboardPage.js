import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import Header from '../../../components/Header';
import Menu from '../../../components/Menu';
import Footer from '../../../components/Footer';
import ContentContainer from '../../../components/ContentContainer';
import VentasPage from '../../../modules/ventas/pages/VentasPage';
import RegistrarUsuarioPage from '../../../modules/admin/pages/RegistrarUsuarioPage';
import UsuariosPage from '../../../modules/admin/pages/UsuariosPage';
import ComunasPage from '../../../modules/admin/pages/ComunasPage';
import TarifasPage from '../../../modules/admin/pages/TarifasPage';
import EmpresasPage from '../../../modules/admin/pages/EmpresasPage';
import CanalesVentaPage from '../../admin/pages/CanalesVentaPage';
import DetalleUsuarioPage from '../../../modules/admin/pages/DetalleUsuarioPage';
import MiPerfilPage from '../../../modules/profile/pages/MiPerfilPage';
import IngresarVentasPage from '../../../modules/ventas/pages/IngresarVentasPage';
import DetalleVentaPage from '../../../modules/ventas/pages/DetalleVentaPage';
import TablaDatosPage from '../../admin/pages/TablaDatosPage';
import DetalleComunaPage from '../../admin/pages/DetalleComunaPage';
import MotivosPage from '../../admin/pages/MotivosPage';
import withAuthorization from '../../../contexts/withAuthorization';
import './Dashboard.css';

const accessControl = {
  'Ventas': [1, 2, 3, 4, 5, 6],
  'Ingresar venta': [1, 2, 3],
  'Registrar usuario': [1, 2],
  'Usuarios': [1, 2, 6],
  'Datos': [1],
  'Detalle Comuna': [1],
  'Motivos': [1],
  'Comunas': [1],
  'Tarifas': [1],
  'Empresas': [1],
  'Canales de venta': [1],
  'Mi perfil': [1, 2, 3, 4, 5, 6],
};

const DashboardPage = () => {
  const { roleId } = useContext(UserContext);
  const [selectedOption, setSelectedOption] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const id = params.get('id');
    const communeId = params.get('communeId');
    
    if (page === 'detalle-venta' && id) {
      return 'Detalle Venta';
    }
    if (page === 'detalle-usuario' && id) {
      return 'Detalle Usuario';
    }
    if (page === 'detalle-comuna' && communeId) {
      return 'Detalle Comuna';
    }
    return page || 'Ventas';
  });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || null;
  });
  
  const [selectedUserId, setSelectedUserId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || null;
  });

  const [selectedCommuneId, setSelectedCommuneId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('communeId') || null;
  });
  
  const [pagination, setPagination] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return { page: parseInt(params.get('page')) || 1 };
  });

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedOption === 'Detalle Venta') {
      params.set('page', 'detalle-venta');
      if (selectedSaleId) params.set('id', selectedSaleId);
    } else if (selectedOption === 'Detalle Usuario') {
      params.set('page', 'detalle-usuario');
      if (selectedUserId) params.set('id', selectedUserId);
    } else if (selectedOption === 'Detalle Comuna') {
      params.set('page', 'detalle-comuna');
      if (selectedCommuneId) params.set('communeId', selectedCommuneId);
    } else {
      params.set('page', selectedOption);
    }
    
    if (pagination.page && pagination.page !== 1) {
      params.set('page', pagination.page);
    }
    
    window.history.replaceState(
      {}, 
      '', 
      `${window.location.pathname}?${params.toString()}`
    );
  }, [selectedOption, selectedSaleId, selectedUserId, selectedCommuneId, pagination]);

  const handleMenuClick = (option) => {
    if (accessControl[option]?.includes(roleId)) {
      setSelectedOption(option);
      setErrorMessage('');
      setPagination({ page: 1 });
      setSelectedSaleId(null);
      setSelectedUserId(null);
    } else {
      setErrorMessage('Acceso denegado: No tienes permisos para ver esta página.');
    }
  };

  const handleCommuneClick = (communeId) => {
    setSelectedCommuneId(communeId);
    setSelectedOption('Detalle Comuna');
  };

  const handleSaleClick = (saleId) => {
    setSelectedSaleId(saleId);
    setSelectedOption('Detalle Venta');
  };

  const handleUserClick = (idUser) => {
    setSelectedUserId(idUser);
    setSelectedOption('Detalle Usuario');
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
    setSelectedOption('Usuarios');
  };

  const handleBackToVentas = () => {
    setSelectedSaleId(null);
    setSelectedOption('Ventas');
  };

  const handleBackToTablaDatos = () => {
    setSelectedCommuneId(null);
    setSelectedOption('Datos');
  };

  const renderContent = () => {
    if (selectedOption === 'Detalle Venta' && selectedSaleId) {
      return <DetalleVentaPage saleId={selectedSaleId} onBack={handleBackToVentas} />;
    } else if (selectedOption === 'Detalle Usuario' && selectedUserId) {
      return <DetalleUsuarioPage idUser={selectedUserId} onBack={handleBackToUsers} />;
    } else if (selectedOption === 'Detalle Comuna' && selectedCommuneId) {
      return <DetalleComunaPage communeId={selectedCommuneId} onBack={handleBackToTablaDatos} />;
    }
  
    const components = {
      'Ventas': <VentasPage onSaleClick={handleSaleClick} pagination={pagination} setPagination={setPagination} />,
      'Ingresar venta': <IngresarVentasPage />,
      'Registrar usuario': <RegistrarUsuarioPage />,
      'Usuarios': <UsuariosPage onUserClick={handleUserClick} pagination={pagination} setPagination={setPagination} />,
      'Datos': <TablaDatosPage onCommuneClick={handleCommuneClick} />,
      'Comunas': <ComunasPage />,
      'Tarifas': <TarifasPage />,
      'Empresas': <EmpresasPage />,
      'Canales de venta': <CanalesVentaPage />,
      'Motivos': <MotivosPage />,
      'Mi perfil': <MiPerfilPage />,
    };
  
    return components[selectedOption] || <VentasPage onSaleClick={handleSaleClick} pagination={pagination} setPagination={setPagination} />;
  };

  return (
    <div className="dashboard-container">
      <Header />
      <div className="content-area">
        <Menu className="menu-sidebar" role_id={roleId} onMenuClick={handleMenuClick} />
        <div className="page-container">
          <ContentContainer>
            {errorMessage ? <p>{errorMessage}</p> : renderContent()}
          </ContentContainer>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default withAuthorization(DashboardPage, [1, 2, 3, 4, 5, 6]);