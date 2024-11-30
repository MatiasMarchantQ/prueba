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
      throw new Error('API call failed');
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

//Obtener empresas
const ObtenerEmpresas = ({ companies }) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  return (
    <select value={selectedCompany} onChange={handleCompanyChange}>
      <option value="">Seleccione una empresa</option>
      {companies.map((company) => (
        <option key={company.company_id} value={company.company_id}>
          {company.company_name}
        </option>
      ))}
    </select>
  );
};

const CrearEmpresa = ({ token, onSubmitWithRecaptcha  }) => {
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompanyNameChange = (e) => {
    setCompanyName(e.target.value);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyName) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      setIsSubmitting(true);
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/companies/create`, 
          'POST', 
          {
            companyName,
            recaptchaToken
          }, 
          token
        );
        alert(result.message);
        setIsSubmitting(false);
        window.location.reload();
      } catch (error) {
        console.error('Error al crear empresa:', error);
        alert(error.message);
        setIsSubmitting(false);
      }
    };

    await onSubmitWithRecaptcha(e, submitForm);
  };

  return (
    <form className="comunas-tarifas-field-group" onSubmit={handleCreateCompany}>
      <h3>Crear Empresa</h3>
      <input type="text" value={companyName} onChange={handleCompanyNameChange} placeholder="Nombre de la empresa"/>
      <button type="submit" disabled={isSubmitting}>Crear Empresa</button>
    </form>
  );
};

//Actualizar empresa
const ActualizarEmpresa = ({ token, onSubmitWithRecaptcha  }) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/companies/all`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const data = await response.json();
        setCompanies(data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, [token]);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
    const selectedCompanyData = companies.find((company) => company.company_id === parseInt(e.target.value));
    if (selectedCompanyData) {
      setCompanyName(selectedCompanyData.company_name);
    } else {
      setCompanyName('');
    }
  };

  const handleCompanyNameChange = (e) => {
    setCompanyName(e.target.value);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !companyName) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const submitForm = async (event, recaptchaToken) => {
      setIsSubmitting(true);
      try {
        const result = await apiCall(
          `${process.env.REACT_APP_API_URL}/companies/${selectedCompany}`, 
          'PUT', 
          {
            companyName,
            recaptchaToken
          }, 
          token
        );
        alert(result.message);
        setIsSubmitting(false);
        window.location.reload();
      } catch (error) {
        console.error('Error al actualizar empresa:', error);
        alert('Error al actualizar empresa');
        setIsSubmitting(false);
      }
    };

    await onSubmitWithRecaptcha(e, submitForm);
  };

  return (
    <form className="comunas-tarifas-field-group" onSubmit={handleUpdateCompany}>
      <h3>Actualizar Empresa</h3>
      <select value={selectedCompany} onChange={handleCompanyChange}>
        <option value="">Seleccione una empresa</option>
        {companies.map((company) => (
          <option key={company.company_id} value={company.company_id}>
            {company.company_name}
          </option>
        ))}
      </select>
      <input type="text" value={companyName} onChange={handleCompanyNameChange} placeholder="Nombre de la empresa"/>
      <button type="submit" disabled={isSubmitting}>Actualizar Empresa</button>
    </form>
  );
};

//Campiar prioridad empresa
const SwapCompanyPriority = ({ token }) => {
  const [companyId1, setCompanyId1] = useState('');
  const [companyId2, setCompanyId2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/companies/all`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const data = await response.json();
        setCompanies(data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, [token]);

  const handleCompanyId1Change = (e) => {
    setCompanyId1(e.target.value);
  };

  const handleCompanyId2Change = (e) => {
    setCompanyId2(e.target.value);
  };

  const handleSwapPriority = async (e) => {
    e.preventDefault();
    if (!companyId1 || !companyId2) {
      alert('Por favor complete todos los campos.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await apiCall(`${process.env.REACT_APP_API_URL}/companies/swap-priority-levels`, 'POST', {
        companyId1,
        companyId2,
      }, token);
      alert(result.message);
      setIsSubmitting(false);
      window.location.reload();
    } catch (error) {
      console.error('Error al intercambiar prioridad de empresas:', error);
      alert('Error al intercambiar prioridad de empresas');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSwapPriority}>
      <h3>Intercambiar prioridad de empresas</h3>
      <select value={companyId1} onChange={handleCompanyId1Change}>
        <option value="">Seleccione una empresa</option>
        {[...companies] // Crear una copia del array para no mutar el original
          .sort((a, b) => a.priority_level - b.priority_level) // Ordenar por priority_level
          .map((company) => (
            <option key={company.company_id} value={company.company_id}>
              {company.company_name} (Prioridad: {company.priority_level})
            </option>
          ))}
      </select>
      <select value={companyId2} onChange={handleCompanyId2Change}>
        <option value="">Seleccione otra empresa</option>
        {[...companies]
          .sort((a, b) => a.priority_level - b.priority_level)
          .map((company) => (
            <option key={company.company_id} value={company.company_id}>
              {company.company_name} (Prioridad: {company.priority_level})
            </option>
          ))}
      </select>
      <button type="submit" disabled={isSubmitting}>Intercambiar prioridad</button>
    </form>
  );
};


// Habilitar/Deshabilitar empresa
const ToggleCompanyStatus = ({ token }) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const getCompanies = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/companies/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setCompanies(data);
      } catch (error) {
        console.error('Error al obtener las empresas:', error);
      }
    };
    getCompanies();
  }, [token]);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  const handleIsActiveChange = (e) => {
    setIsActive(e.target.value);
  };

  const handleToggleStatus = async (e) => {
    e.preventDefault();
    if (!selectedCompany || isActive === '') {
      alert('Por favor seleccione una empresa y especifique el estado.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await apiCall(`${process.env.REACT_APP_API_URL}/companies/${selectedCompany}/toggle-status`, 'PATCH', {
        is_active: isActive === '1',
      }, token);
      alert(result.message);
      setIsSubmitting(false);
      window.location.reload();
    } catch (error) {
      console.error('Error al habilitar/deshabilitar empresa:', error);
      alert('Error al habilitar/deshabilitar empresa');
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleToggleStatus}>
      <h3>Habilitar/Deshabilitar empresa</h3>
      <select value={selectedCompany} onChange={handleCompanyChange}>
        <option value="">Seleccione una empresa</option>
        {Array.isArray(companies) && companies.map((company) => (
          <option key={company.company_id} value={company.company_id}>
            {company.company_name} (Estado: {company.is_active === true ? 'Habilitada' : 'Deshabilitada'})
          </option>
        ))}
      </select>
      <select value={isActive} onChange={handleIsActiveChange}>
        <option value="">Seleccione el estado</option>
        <option value="1">Habilitar</option>
        <option value="0">Deshabilitar</option>
      </select>
      <button type="submit" disabled={isSubmitting}>Habilitar/Deshabilitar</button>
    </form>
  );
};

// Envolver los componentes con withRecaptcha
const CrearEmpresaWithRecaptcha = withRecaptcha(CrearEmpresa, 'create_company');
const ActualizarEmpresaWithRecaptcha = withRecaptcha(ActualizarEmpresa, 'update_company');


// Main component
const Empresas = () => {
  const { token } = useContext(UserContext);
  const [isOpenSwapPriority, toggleSwapPriority] = useToggleCard();
  const [isOpenObtenerEmpresas, toggleObtenerEmpresas] = useToggleCard();
  const [companies, setCompanies] = useState([]);
  const [isOpenCrearEmpresa, toggleCrearEmpresa] = useToggleCard();
  const [isOpenUpdateCompany, toggleUpdateCompany] = useToggleCard();
  const [isOpenToggleCompanyStatus, toggleToggleCompanyStatus] = useToggleCard();


  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [companiesData] = await Promise.all([
          apiCall(`${process.env.REACT_APP_API_URL}/companies`, 'GET', null, token)
        ]);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [token]);

  return (
    <div className='card-grid'>
      <h1 style={{textAlign: 'center', color: '#99235C'}}>Empresas</h1>
      <Card title="Obtener Empresas" isOpen={isOpenObtenerEmpresas} toggle={toggleObtenerEmpresas}  className="card-obtener-empresas">
        <ObtenerEmpresas token={token} companies={companies} />
      </Card>

      <Card title=" Crear Empresa" isOpen={isOpenCrearEmpresa} toggle={toggleCrearEmpresa}>
        <CrearEmpresaWithRecaptcha token={token} />
      </Card>

      <Card title="Actualizar Empresa" isOpen={isOpenUpdateCompany} toggle={toggleUpdateCompany}>
        <ActualizarEmpresaWithRecaptcha token={token} companies={companies} />
      </Card>

      <Card title="Intercambiar prioridad de empresas" isOpen={isOpenSwapPriority} toggle={toggleSwapPriority}>
        <SwapCompanyPriority token={token} companies={companies} />
      </Card>

      <Card title="Habilitar/Deshabilitar empresa" isOpen={isOpenToggleCompanyStatus} toggle={toggleToggleCompanyStatus}>
        <ToggleCompanyStatus token={token} companies={companies} />
      </Card>
    </div>
  );
};


export default Empresas;