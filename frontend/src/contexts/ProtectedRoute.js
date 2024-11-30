// src/contexts/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from './UserContext';

const ProtectedRoute = ({ element: Component, ...rest }) => {
  const { token } = useContext(UserContext);

  return token ? <Component /> : <Navigate to="/" />;
};

export default ProtectedRoute;
