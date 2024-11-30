// UserRow.js
import { useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import './Usuarios.css';

const UserRow = ({ user, onUserClick }) => {
  const { roleId } = useContext(UserContext);
  const statusClassName = user.status === 1 ? 'status-badge active' : 'status-badge inactive';

  return (
    <tr>
      <td>{`${user.first_name} ${user.last_name}`}</td>
      <td>{user.rut}</td>
      <td>{user.email}</td>
      <td>{user.phone_number}</td>
      <td>{user.company ? user.company.company_name : 'No Aplica'}</td>
      <td>{user.salesChannel ? user.salesChannel.channel_name : 'No Aplica'}</td>
      <td>{user.role ? user.role.role_name : 'No Aplica'}</td>
      <td>{user.contract?.contract_name || 'No Aplica'}</td>
      <td>
        <span className={statusClassName}>
          {user.status === 1 ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      {roleId !== 6 && (
        <td>
          <button className='detalle-button' onClick={() => onUserClick(user.user_id)}>
            <FontAwesomeIcon icon={faEdit} /> Editar
          </button>
        </td>
      )}
    </tr>
  );
};

export default UserRow;