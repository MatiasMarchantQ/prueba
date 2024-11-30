import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import withAuthorization from '../../../contexts/withAuthorization';
import withRecaptcha from '../../../HOC/withRecaptcha';
import './IngresarVenta.css';

const IngresarVentasPage = ({ onSubmitWithRecaptcha }) => {
  const { token, userId, roleId } = useContext(UserContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForeignRut, setIsForeignRut] = useState(false);
  const [formValues, setFormValues] = useState({
    client_first_name: '',
    client_last_name: '',
    client_rut: '',
    client_email: '',
    client_phone: '+56',
    client_secondary_phone: '+56',
    region_id: '',
    commune_id: '',
    street: '',
    number: '',
    department_office_floor: '',
    geo_reference: '',
    promotion_id: '',
    additional_comments: '',
  });
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [installationAmount, setInstallationAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForeignPhone, setIsForeignPhone] = useState(false);
  const [isForeignSecondaryPhone, setIsForeignSecondaryPhone] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);


  useEffect(() => {
    const allowedRoles = [1, 2, 3];
    if (!allowedRoles.includes(roleId)) {
      console.error('Acceso denegado: No tienes permisos para ver las ventas.');
      return;
    }
    fetchRegions();
  }, [roleId]);

  useEffect(() => {
    if (formValues.region_id) {
      fetchCommunes(formValues.region_id);
    }
  }, [formValues.region_id]);

  useEffect(() => {
    if (formValues.commune_id) {
      fetchPromotions(formValues.commune_id);
    }
  }, [formValues.commune_id]);

  useEffect(() => {
    if (formValues.promotion_id) {
      setLoading(true);
      fetchInstallationAmount(formValues.promotion_id);
    }
  }, [formValues.promotion_id]);

  const fetchRegions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/regions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener las regiones');
      const data = await response.json();
      setRegions(data);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const fetchCommunes = async (regionId) => {
    if (!regionId) {
      setCommunes([]);
      setFormValues(prev => ({ ...prev, commune_id: '' }));
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/communes/communes/${regionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener las comunas');
      const data = await response.json();
      setCommunes(data);
      if (data.length === 0) {
        setFormValues(prev => ({ ...prev, commune_id: 'no_communes' }));
      } else {
        setFormValues(prev => ({ ...prev, commune_id: '' }));
      }
    } catch (error) {
      setCommunes([]);
      setFormValues(prev => ({ ...prev, commune_id: 'no_communes' }));
    }
  };

  const fetchPromotions = async (communeId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/promotions/commune/${communeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener las promociones');
      const data = await response.json();
      setPromotions(data);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const fetchInstallationAmount = async (promotionId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/installation-amounts/promotion/${promotionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener el monto de instalación');
      const data = await response.json();
      setInstallationAmount(data.amount);
    } catch (error) {
      setInstallationAmount('Error al cargar');
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxSize = 1024 * 1024; // 1MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
    if (files.length > maxFiles) {
      alert(`Solo se pueden subir un máximo de ${maxFiles} archivos`);
      e.target.value = '';
      return;
    }
  
    const invalidFiles = files.filter(file => 
      !allowedTypes.includes(file.type) || file.size > maxSize
    );
  
    if (invalidFiles.length > 0) {
      alert('Verifique que: \n El archivo tenga formato JPG, JPEG, PNG o PDF \n o que no exceda 1MB de tamaño');      e.target.value = '';
      return;
    }
  
    setErrorMessage('');
    setSelectedFiles(files);
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'region_id') {
      setFormValues(prev => ({
        ...prev,
        [name]: value,
        commune_id: '',
        promotion_id: '',
      }));
      fetchCommunes(value);
    } else if (name === 'commune_id' && value !== 'no_communes') {
      setFormValues(prev => ({ ...prev, [name]: value }));
    } else if ((name === 'client_phone' || name === 'client_secondary_phone')) {
      const isForeign = name === 'client_phone' ? isForeignPhone : isForeignSecondaryPhone;
      if (isForeign) {
        setFormValues(prev => ({ ...prev, [name]: value }));
      } else {
        const phoneNumber = value.replace(/\D/g, '').slice(0, 9); // Limita a 9 dígitos
        setFormValues(prev => ({ ...prev, [name]: '+56' + phoneNumber }));
      }
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  // Modifica el handleSubmit para usar onSubmitWithRecaptcha
const handleSubmit = async (e, recaptchaToken) => {
  e.preventDefault();

  const data = {
    client_first_name: formValues.client_first_name,
    client_last_name: formValues.client_last_name,
    client_rut: formValues.client_rut.replace(/\./g, ''),
    client_email: formValues.client_email,
    client_phone: isForeignPhone ? (formValues.client_phone || null) : (formValues.client_phone.replace('+56', '') || null),
    client_secondary_phone: isForeignSecondaryPhone ? (formValues.client_secondary_phone || null) : (formValues.client_secondary_phone.replace('+56', '') || null),    
    region_id: formValues.region_id,
    commune_id: formValues.commune_id,
    street: formValues.street || null,
    number: formValues.number || null,
    department_office_floor: formValues.department_office_floor || null,
    geo_reference: formValues.geo_reference || null,
    promotion_id: formValues.promotion_id,
    additional_comments: formValues.additional_comments || null,
    sale_status_id: 1
  };

  const files = selectedFiles || [];

  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] === null) {
      formData.append(key, '');
    } else {
      formData.append(key, data[key]);
    }
  });
  
  if (files.length === 0) {
    formData.append('other_images', null);
  } else {
    files.forEach((file) => {
      formData.append('other_images', file);
    });
  }

  // Agregar el token de reCAPTCHA al FormData
  formData.append('recaptchaToken', recaptchaToken);

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    setSuccessMessage('Venta enviada con éxito');
    setShowSuccessMessage(true);
    setErrorMessage('');
    setFormValues({
      client_first_name: '',
      client_last_name: '',
      client_rut: '',
      client_email: '',
      client_phone: '',
      client_secondary_phone: '',
      region_id: '',
      commune_id: '',
      street: '',
      number: '',
      department_office_floor: '',
      geo_reference: '',
      promotion_id: '',
      additional_comments: '',
    });
    setSelectedFiles([]);
    document.querySelector('input[type="file"]').value = '';
    setInstallationAmount('');
  } catch (error) {
    console.error('Error al enviar la venta:', error);
    setErrorMessage(error.message);
    setSuccessMessage('');
  }
};
  

  if (!userId) {
    return <div>Cargando...</div>;
  }

  const handleRutChange = (e) => {
    const rut = e.target.value;
    if (isForeignRut) {
      setFormValues({ ...formValues, client_rut: rut.replace(/[^0-9K]/g, '') });
    } else {
      // Elimina todos los caracteres no numéricos y 'K', excepto el último guion si existe
      let cleanRut = rut.replace(/[^0-9K-]/g, '').replace(/-/g, '');
      
      // Si el RUT tiene más de 1 carácter, inserta el guion antes del último carácter
      if (cleanRut.length > 1) {
        cleanRut = cleanRut.slice(0, -1) + '-' + cleanRut.slice(-1);
      }
      
      setFormValues({ ...formValues, client_rut: cleanRut });
    }
  };
  
  const handleForeignPhoneChange = (e) => {
    const isChecked = e.target.checked;
    setIsForeignPhone(isChecked);
    if (isChecked) {
      setFormValues(prev => ({ ...prev, client_phone: '' }));
    } else {
      setFormValues(prev => ({ ...prev, client_phone: '+56' }));
    }
  };
  
  const handleForeignSecondaryPhoneChange = (e) => {
    const isChecked = e.target.checked;
    setIsForeignSecondaryPhone(isChecked);
    if (isChecked) {
      setFormValues(prev => ({ ...prev, client_secondary_phone: '' }));
    } else {
      setFormValues(prev => ({ ...prev, client_secondary_phone: '+56' }));
    }
  };

  return (
    <div className="ingresar-venta-wrapper">
        <h1 className="ingresar-venta-header">Ingresar venta</h1>
        <h3 style={{color: '#99235C'}}>Cliente</h3>
        <form className="ingresar-venta-form" onSubmit={(e) => onSubmitWithRecaptcha(e, handleSubmit)}>
            <div className="ingresar-venta-fields-group">
                <div className="ingresar-venta-field-group">
                    <label htmlFor="client_first_name">Nombres*</label>
                    <input
                        type="text"
                        className="ingresar-venta-field-control"
                        id="client_first_name"
                        name="client_first_name"
                        value={formValues.client_first_name}
                        onChange={handleInputChange}
                        placeholder='Ej: Juan Pablo Andrés'
                        autoComplete="given-name"
                        required
                    />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="client_last_name">Apellidos*</label>
                    <input
                        type="text"
                        className="ingresar-venta-field-control"
                        id="client_last_name"
                        name="client_last_name"
                        value={formValues.client_last_name}
                        onChange={handleInputChange}
                        placeholder='Ej: García López'
                        autoComplete="family-name"
                        required
                    />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="client_rut">RUT*</label>
                    <input
                        type="text"
                        className="ingresar-venta-field-control"
                        id="client_rut"
                        name="client_rut"
                        placeholder="123456789"
                        value={formValues.client_rut}
                        onChange={handleRutChange}
                        autoComplete="off"
                        required
                    />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="client_email">Email*</label>
                    <input
                        type="email"
                        className="ingresar-venta-field-control"
                        id="client_email"
                        name="client_email"
                        value={formValues.client_email}
                        placeholder='Ej: jpa.garcia@dominio.com'
                        onChange={handleInputChange}
                        autoComplete="email"
                        required
                        rows={1}
                        style={{ resize: 'none', overflow: 'hidden' }}
                        onInput={(e) => {
                          const textarea = e.target;
                          const rows = textarea.value.split('\n').length;
                          textarea.rows = rows;
                          textarea.style.height = 'auto';
                          textarea.style.height = textarea.scrollHeight + 'px';
                        }}
                    />
                </div>

                <div className="ingresar-venta-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label htmlFor="client_phone">Número celular*</label>
                    <label>
                      <input
                        type="checkbox"
                        checked={isForeignPhone}
                        onChange={handleForeignPhoneChange}
                      />
                      Otros
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {!isForeignPhone && (
                      <span style={{ 
                        backgroundColor: '#e0e0e0', 
                        padding: '11px',
                        marginBottom: '10px',
                        borderRadius: '4px 0 0 4px',
                        color: '#666'
                      }}>
                        +56
                      </span>
                    )}
                    <input
                      type="text"
                      className="ingresar-venta-field-control"
                      id="client_phone"
                      name="client_phone"
                      value={isForeignPhone ? formValues.client_phone : formValues.client_phone.slice(3)}
                      onChange={handleInputChange}
                      autoComplete="tel"
                      required
                      style={{ 
                        borderRadius: isForeignPhone ? '4px' : '0 4px 4px 0',
                        flexGrow: 1
                      }}
                    />
                  </div>
                </div>

                <div className="ingresar-venta-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label htmlFor="client_secondary_phone" style={{fontSize: 12}}>2do Número celular</label> <label>
                      <input
                        type="checkbox"
                        checked={isForeignSecondaryPhone}
                        onChange={handleForeignSecondaryPhoneChange}
                      />
                      Otros
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {!isForeignSecondaryPhone && (
                      <span style={{ 
                        backgroundColor: '#e0e0e0', 
                        padding: '11px',
                        marginBottom: '10px', 
                        borderRadius: '4px 0 0 4px',
                        color: '#666'
                      }}>
                        +56
                      </span>
                    )}
                    <input
                      type="text"
                      className="ingresar-venta-field-control"
                      id="client_secondary_phone"
                      name="client_secondary_phone"
                      value={isForeignSecondaryPhone ? formValues.client_secondary_phone : formValues.client_secondary_phone.slice(3)}
                      onChange={handleInputChange}
                      autoComplete="tel"
                      style={{ 
                        borderRadius: isForeignSecondaryPhone ? '4px' : '0 4px 4px 0',
                        flexGrow: 1
                      }}
                    />
                  </div>
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="region_id">Región*</label>
                    <select
                        className="ingresar-venta-field-control"
                        id="region_id"
                        name="region_id"
                        value={formValues.region_id}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Seleccione la región</option>
                        {regions.map((region) => (
                            <option key={region.region_id} value={region.region_id}>
                                {region.region_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ingresar-venta-field-group">
                  <label htmlFor="commune_id">Comuna*</label>
                  <select
                    className="ingresar-venta-field-control"
                    id="commune_id"
                    name="commune_id"
                    value={formValues.commune_id}
                    onChange={handleInputChange}
                    required
                    disabled={!formValues.region_id || communes.length === 0}
                  >
                    {formValues.region_id && communes.length === 0 ? (
                      <option value="no_communes">No hay comunas asociadas</option>
                    ) : (
                      <>
                        <option value="">Seleccione la comuna</option>
                        {communes.map((commune) => (
                          <option key={commune.commune_id} value={commune.commune_id}>
                            {commune.commune_name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div className="ingresar-venta-field-group">
                  <label htmlFor="street">Calle/Avenida</label>
                  <textarea
                    type="text"
                    className="ingresar-venta-field-control"
                    id="street"
                    name="street"
                    value={formValues.street}
                    onChange={handleInputChange}
                    placeholder="Ej: Avenida Santa María"
                    autoComplete="address-line1"
                    rows={1}
                    style={{ resize: 'none', overflow: 'hidden' }}
                    onInput={(e) => {
                      const textarea = e.target;
                      const rows = textarea.value.split('\n').length;
                      textarea.rows = rows;
                      textarea.style.height = 'auto';
                      textarea.style.height = textarea.scrollHeight + 'px';
                    }}
                  />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="number">Número Casa</label>
                    <input
                        type="text"
                        className="ingresar-venta-field-control"
                        id="number"
                        name="number"
                        value={formValues.number}
                        onChange={handleInputChange}
                        placeholder='Ej: 1234'
                        autoComplete="address-line2"
                    />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="department_office_floor">Departamento/Oficina/Piso (Opcional)</label>
                    <input
                        type="text"
                        className="ingresar-venta-field-control"
                        id="department_office_floor"
                        name="department_office_floor"
                        value={formValues.department_office_floor}
                        onChange={handleInputChange}
                        placeholder='Ej: Departamento 3, Piso 2'
                        autoComplete="address-line2"
                    />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="geo_reference">Referencia geográfica</label>
                    <textarea
                        type="text"
                        className="ingresar-venta-field-control"
                        id="geo_reference"
                        name="geo_reference"
                        value={formValues.geo_reference}
                        onChange={handleInputChange}
                        placeholder='Ej: https://maps.app.goo.gl/jcyUsAFpiGem5xcK8'
                        autoComplete="off"
                        rows={3}
                        style={{ resize: 'none', overflow: 'hidden' }}
                        onInput={(e) => {
                          const textarea = e.target;
                          const rows = textarea.value.split('\n').length;
                          textarea.rows = rows;
                          textarea.style.height = 'auto';
                          textarea.style.height = textarea.scrollHeight + 'px';
                        }}
                    />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="promotion_id">Plan + Promoción</label>
                    <select
                        className="ingresar-venta-field-control"
                        id="promotion_id"
                        name="promotion_id"
                        value={formValues.promotion_id}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Seleccione la promoción</option>
                        {promotions.map((promotion) => (
                            <option key={promotion.promotion_id} value={promotion.promotion_id}>
                                {promotion.promotion}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ingresar-venta-field-group">
                    <label>Monto de instalación</label>
                    <input
                        type="text"
                        className="ingresar-venta-field-control no-border"
                        value={loading ? 'Cargando...' : installationAmount}
                        placeholder='Seleccione la promoción'
                        readOnly
                    />
                </div>

                <div className="ingresar-venta-field-group">
                    <label htmlFor="additional_comments">Comentarios adicionales</label>
                    <textarea
                        className="ingresar-venta-field-control"
                        id="additional_comments"
                        name="additional_comments"
                        value={formValues.additional_comments}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="ingresar-venta-field-group">
                  <label>Archivo(s) (Formatos: JPG, JPEG, PNG, PDF. Máx. 5 archivos, 1MB c/u)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    multiple
                    name="other_images"
                    onChange={handleFileChange}
                    className='input-file'
                  />
                </div>
            </div>
            <button type="submit" className="ingresar-venta-submit-button" style={{ display: showSuccessMessage ? 'none' : 'block' }}>Enviar venta</button>
            {showSuccessMessage && (
              <div>
                <div className="success-message">{successMessage}</div>
                <a href="/dashboard" className="link-to-dashboard">Ir a ventas</a><br/><br/>
                <button onClick={() => {
                  setShowSuccessMessage(false);
                  window.scrollTo(0, 0);
                }} className="link-to-new-sale">Ingresar otra venta</button>
              </div>
            )}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </form>
    </div>
  );
};

export default withAuthorization(
  withRecaptcha(IngresarVentasPage, 'create_sale'),
  [1, 2, 3 ]
);