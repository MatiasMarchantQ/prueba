import React, { useContext } from 'react';
import { UserContext } from './UserContext';
import { useNavigate } from 'react-router-dom';


const withAuthorization = (WrappedComponent, allowedRoles) => {
  return (props) => {
    const { roleId } = useContext(UserContext);
    const navigate = useNavigate();

    if (!allowedRoles.includes(roleId)) {
      navigate('/unauthorized');
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuthorization;
