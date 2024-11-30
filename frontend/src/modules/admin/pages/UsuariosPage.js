import React, { useState, useEffect, useContext, useCallback, lazy, Suspense } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import withAuthorization from '../../../contexts/withAuthorization';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Usuarios.css';

const UserRow = lazy(() => import('./UserRow'));
const Pagination = lazy(() => import('./Pagination'));

const UsuariosPage = ({ onUserClick }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, roleId } = useContext(UserContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 15;

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [salesChannels, setSalesChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [contracts, setContracts] = useState([]);

  const [filters, setFilters] = useState({
    company_id: '',
    sales_channel_id: '',
    role_id: '',
    status: '',
    contract_id: '',
    search: '',
    sort: 'user_id',
    order: 'asc',
  });

  const [pendingFilters, setPendingFilters] = useState(filters);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      }).toString();

      const response = await fetch(`${process.env.REACT_APP_API_URL}/users?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsers(data.totalUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [companiesRes, channelsRes, rolesRes, contractsRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.REACT_APP_API_URL}/channels`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.REACT_APP_API_URL}/roles`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.REACT_APP_API_URL}/contracts`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [companiesData, channelsData, rolesData, contractsData] = await Promise.all([
          companiesRes.json(),
          channelsRes.json(),
          rolesRes.json(),
          contractsRes.json(),
        ]);

        setCompanies(companiesData);
        setSalesChannels(channelsData);
        setRoles(rolesData);
        setContracts(contractsData);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFilterData();
  }, [token]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPendingFilters((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSearchChange = (e) => {
    setPendingFilters((prev) => ({ ...prev, search: e.target.value }));
  };
  
  const applyFilters = () => {
    setFilters(pendingFilters);
    setCurrentPage(1);
    setIsFilterActive(true);
  };

  const applySearch = () => {
    setFilters(prevFilters => ({
      ...prevFilters,
      search: pendingFilters.search
    }));
    setCurrentPage(1);
    setIsSearchActive(true);
  };

  const clearFilters = () => {
    const newFilters = {
      company_id: '',
      sales_channel_id: '',
      role_id: '',
      status: '',
      contract_id: '',
      sort: 'user_id',
      order: 'asc',
    };
    setPendingFilters(prevFilters => ({
      ...newFilters,
      search: prevFilters.search // Mantener la búsqueda actual
    }));
    setFilters(newFilters);
    setCurrentPage(1);
    setIsFilterActive(false);
    fetchUsers();
  };

  const clearSearch = () => {
    setPendingFilters(prevFilters => ({ ...prevFilters, search: '' }));
    setFilters(prevFilters => ({ ...prevFilters, search: '' }));
    setIsSearchActive(false);
    fetchUsers();
  };
  
  return (
    <div className="usuarios-page">
      <h1>Lista de Usuarios</h1>

      <div className="ventas-page">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={pendingFilters.search}
            onChange={handleSearchChange}
          />
          <button className='search-button' onClick={applySearch}>
            <FontAwesomeIcon icon={faSearch} /> Buscar
          </button>
          {isSearchActive && (
            <button className='search-button' onClick={clearSearch}>
            <FontAwesomeIcon icon={faTimes} /> Limpiar búsqueda
          </button>
          )}
          <button className="filter-button" onClick={() => setIsFilterVisible(!isFilterVisible)}>
            <FontAwesomeIcon icon={faFilter} /> Filtros
          </button>
        </div>
      </div>

      <div className="filter-section">
        {isFilterVisible && (
          <div className="filters">
            {roleId === 1 && (
              <select name="company_id" value={pendingFilters.company_id} onChange={handleFilterChange}>
                <option value="">Todas las empresas</option>
                {companies.map((company) => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            )}

            <select name="sales_channel_id" value={pendingFilters.sales_channel_id} onChange={handleFilterChange}>
              <option value="">Todos los canales de venta</option>
              {salesChannels.map((channel) => (
                <option key={channel.sales_channel_id} value={channel.sales_channel_id}>
                  {channel.channel_name}
                </option>
              ))}
            </select>

            <select name="role_id" value={pendingFilters.role_id} onChange={handleFilterChange}>
              <option value="">Todos los roles</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>

            <select name="status" value={pendingFilters.status} onChange={handleFilterChange}>
              <option value="">Todos los estados</option>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>

            <select name="contract_id" value={pendingFilters.contract_id} onChange={handleFilterChange}>
              <option value="">Todos los tipos de contrato</option>
              {contracts.map((contract) => (
                <option key={contract.contract_id} value={contract.contract_id}>
                  {contract.contract_name}
                </option>
              ))}
            </select>

            <select name="sort" value={pendingFilters.sort} onChange={handleFilterChange}>
              <option value="first_name">Ordenar por Nombre</option>
              <option value="last_name">Ordenar por Apellido</option>
              <option value="email">Ordenar por Email</option>
              <option value="created_at">Ordenar por Fecha de Creación</option>
            </select>

            <select name="order" value={pendingFilters.order} onChange={handleFilterChange}>
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>

            <button onClick={applyFilters}>Aplicar filtros</button>
            {isFilterActive && (
              <button onClick={clearFilters}>
                <FontAwesomeIcon icon={faTimes} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>RUT</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Empresa</th>
              <th>Canal de Venta</th>
              <th>Rol</th>
              <th>Tipo de Contrato</th>
              <th>Estado</th>
              {roleId !== 6 && <th>Detalle</th>}
            </tr>
          </thead>
          <tbody>
            <Suspense fallback={<tr><td colSpan="9">Cargando usuarios...</td></tr>}>
              {users.map((user) => (
                <UserRow key={user.user_id} user={user} onUserClick={onUserClick} />
              ))}
            </Suspense>
          </tbody>
        </table>
      </div>

      <Suspense fallback={<div>Cargando paginación...</div>}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalUsers={totalUsers}
        />
      </Suspense>
    </div>
  );
};

export default withAuthorization(UsuariosPage, [1, 2, 6]);
