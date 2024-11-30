import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import './Menu.css';

const Menu = ({ role_id, onMenuClick }) => {
  const { token } = useContext(UserContext);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const navigate = useNavigate();

  let menuOptions = [];

  if (role_id === 1) {
    menuOptions = [
      { label: 'Ventas', action: 'Ventas' },
      { label: 'Ingresar venta', action: 'Ingresar venta' },
      {
        label: 'Gestión de administración',
        submenu: [
          { label: 'Registrar usuario', action: 'Registrar usuario' },
          { label: 'Usuarios', action: 'Usuarios' },
          { label: 'Tabla promociones por zona', action: 'Datos' },
          { label: 'Comunas', action: 'Comunas' },
          { label: 'Promociones y Montos de instalación', action: 'Tarifas' },
          { label: 'Empresas', action: 'Empresas' },
          { label: 'Canales de venta', action: 'Canales de venta' },
          { label: 'Motivos', action: 'Motivos' },
          
        ],
      },
      { label: 'Mi perfil', action: 'Mi perfil' },
      { label: 'Cerrar sesión', action: 'Cerrar sesión' },
    ];
  } else if (role_id === 2) {
    menuOptions = [
      { label: 'Ventas', action: 'Ventas' },
      { label: 'Ingresar venta', action: 'Ingresar venta' },
      {
        label: 'Gestión de administración',
        submenu: [
          { label: 'Registrar usuario', action: 'Registrar usuario' },
          { label: 'Usuarios', action: 'Usuarios' },
        ],
      },
      { label: 'Mi perfil', action: 'Mi perfil' },
      { label: 'Cerrar sesión', action: 'Cerrar sesión' },
    ];
  } else if (role_id === 3) {
    menuOptions = [
      { label: 'Ventas', action: 'Ventas' },
      { label: 'Ingresar venta', action: 'Ingresar venta' },
      { label: 'Mi perfil', action: 'Mi perfil' },
      { label: 'Cerrar sesión', action: 'Cerrar sesión' },
    ];
  } else if (role_id === 4) {
    menuOptions = [
      { label: 'Ventas', action: 'Ventas' },
      { label: 'Mi perfil', action: 'Mi perfil' },
      { label: 'Cerrar sesión', action: 'Cerrar sesión' },
    ];
  } else if (role_id === 5) {
    menuOptions = [
      { label: 'Ventas', action: 'Ventas' },
      { label: 'Mi perfil', action: 'Mi perfil' },
      { label: 'Cerrar sesión', action: 'Cerrar sesión' },
    ];
  } else if (role_id === 6) {
    menuOptions = [
      { label: 'Ventas', action: 'Ventas' },
      { label: 'Mi perfil', action: 'Mi perfil' },
      { label: 'Usuarios', action: 'Usuarios' },
      { label: 'Cerrar sesión', action: 'Cerrar sesión' },
    ];
  }

  return (
    <ul className="menu-sidebar">
      <h1>Menú</h1>
      <hr />
      <br />
      {menuOptions.map((option, index) => (
        <li key={index}>
          <button
            onClick={() => {
              if (option.label === 'Cerrar sesión') {
                handleLogout();
              } else if (option.submenu) {
                setShowSubmenu(!showSubmenu);
              } else {
                onMenuClick(option.action);
              }
            }}
          >
            {option.label}
            {option.submenu && <span className={`arrow ${showSubmenu ? 'up' : 'down'}`} />}
          </button>
          {option.submenu && showSubmenu && (
            <ul>
              {option.submenu.map((submenuOption, submenuIndex) => (
                <li key={submenuIndex}>
                  <button onClick={() => onMenuClick(submenuOption.action)}>
                    {submenuOption.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <hr />
        </li>
      ))}
    </ul>
  );

  async function handleLogout() {
    try {
      // Realiza la solicitud al endpoint de logout
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Envía el token en el header
        }
      });

      if (response.ok) {
        console.clear();
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        document.cookie.split(';').forEach((c) => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        navigate('/');
      } else {
        console.error('Error al cerrar sesión');
      }
    } catch (error) {
      console.error('Error al intentar cerrar sesión:', error);
    }
  }
};

export default Menu;
