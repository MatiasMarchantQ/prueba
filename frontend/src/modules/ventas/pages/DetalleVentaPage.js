import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserContext } from '../../../contexts/UserContext';
import withAuthorization from '../../../contexts/withAuthorization';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import withRecaptcha from '../../../HOC/withRecaptcha'; // Import the HOC
import { faImage, faArrowLeftLong, faDownload, faStar as faStarSolid, faStar} from '@fortawesome/free-solid-svg-icons';
import './DetalleVenta.css';

const DetalleVentaPage = ({ saleId, onBack, onSubmitWithRecaptcha  }) => {
  const { token, roleId } = useContext(UserContext);
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedSale, setUpdatedSale] = useState({});
  const [regions, setRegions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [installationAmount, setInstallationAmount] = useState(null);
  const [saleStatuses, setSaleStatuses] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [updateMessage, setUpdateMessage] = useState('');
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const fileInputRef = useRef(null);

  const currentSaleId = saleId;

  useEffect(() => {
    if (sale && sale.other_images) {
      setExistingImages(sale.other_images.split(','));
    }
  }, [sale]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length + files.length;
    const maxFileSize = 1 * 1024 * 1024; // 1MB en bytes
    
    // Validación de tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    // Validación de tamaño de archivo
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      alert('Uno o más archivos exceden el límite de 1MB permitido');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
  
    if (invalidFiles.length > 0) {
      alert('Solo se permiten archivos de tipo JPG, JPEG, PNG y PDF');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
  
    if (totalImages > 5) {
      alert('No puedes subir más de 5 imágenes en total.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
  
    // Procesar archivos válidos
    setNewImages(prevImages => [...prevImages, ...files]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadAllImages = async () => {
    if (!sale.other_images_url || sale.other_images_url.length === 0) {
      alert('No hay archivos para descargar.');
      return;
    }
  
    for (let i = 0; i < sale.other_images_url.length; i++) {
      const fileUrl = sale.other_images_url[i];
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const fileType = response.headers.get('Content-Type');
        let fileName = `archivo_${i + 1}`;
  
        if (fileType === 'application/pdf') {
          fileName += '.pdf';
        } else if (fileType.startsWith('image/')) {
          fileName += `.jpg`; // o cualquier otro formato de imagen que desees
        } else {
          // Manejar otros tipos de archivos
          fileName += `.unknown`;
        }
  
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error al descargar el archivo:', error);
      }
    }
  };

  const handleDeleteExistingImage = (index) => {
    setExistingImages(prevImages => prevImages.filter((_, i) => i !== index));
  };
  
  const handleDeleteNewImage = (index) => {
    setNewImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handlePriorityToggle = async () => {
    try {
      const newPriorityValue = sale.is_priority === 1 ? 0 : 1;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/update-priority/${currentSaleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_priority: newPriorityValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update priority');
      }

      const updatedSaleData = await response.json();
      setSale(prevSale => ({ ...prevSale, is_priority: newPriorityValue }));
      setUpdatedSale(prevUpdatedSale => ({ ...prevUpdatedSale, is_priority: newPriorityValue }));
      setUpdateMessage('Prioridad actualizada con éxito!');
    } catch (error) {
      console.error('Error updating priority:', error);
      setUpdateMessage('Error al actualizar la prioridad');
    }
  };


  // Fetch functions
  const fetchSaleDetails = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/${currentSaleId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Error fetching sale details: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      setSale(data);
      setUpdatedSale(data);
      if (data.other_images_url) {
        setImages(data.other_images_url);
      }
    } catch (error) {
      console.error('Error in request:', error);
    } finally {
      setLoading(false);
    }
  }, [currentSaleId, token]);

  const fetchSaleStatuses = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sale-statuses`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Error fetching sale statuses');
      const data = await response.json();
  
      // Filtrar los estados de venta si el roleId es 5
      if (roleId === 5) {
        const filteredData = data.filter(saleStatus => saleStatus.sale_status_id !== 2);
        setSaleStatuses(filteredData);
      } else {
        setSaleStatuses(data);
      }
    } catch (error) {
      console.error('Error fetching sale statuses:', error);
    }
  };

  const fetchReasons = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sale-statuses/reasons/${updatedSale.sale_status_id}`, {
        method: 'GET',
        headers: headers,
      });
      if (!response.ok) throw new Error('Error fetching reasons');
      const data = await response.json();
      setReasons(data);
    } catch (error) {
      console.error('Error fetching reasons:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/regions`, {
        method: 'GET',
        headers: headers,
      });
      if (!response.ok) throw new Error('Error fetching regions');
      const data = await response.json();
      setRegions(data);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchCommunes = async (regionId) => {
    if (!regionId) {
      setCommunes([]);
      return;
    }
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/communes/communes/${regionId}`, {
        method: 'GET',
        headers: headers,
      });
      if (!response.ok) throw new Error('Error fetching communes');
      const data = await response.json();
      setCommunes(data);
    } catch (error) {
      console.error('Error fetching communes:', error);
    }
  };
  
  const fetchPromotions = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/promotions/commune/${updatedSale.commune_id}`, {
        method: 'GET',
        headers: headers,
      });
      if (!response.ok) throw new Error('Error fetching promotions');
      const data = await response.json();
      setPromotions(data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };
  
  const fetchInstallationAmount = async (promotionId) => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/installation-amounts/promotion/${promotionId}`, {
        method: 'GET',
        headers: headers,
      });
      const data = await response.json();
      setInstallationAmount(data.amount);
    } catch (error) {
      console.error('Error al obtener el monto de instalación:', error);
      setInstallationAmount('Error al cargar');
    }
  };

  // Effect hooks
  useEffect(() => {
    fetchSaleDetails();
    fetchSaleStatuses();
    fetchRegions();
  }, [fetchSaleDetails]);

  useEffect(() => {
    if (updatedSale.region_id) fetchCommunes(updatedSale.region_id);
  }, [updatedSale.region_id]);

  useEffect(() => {
    if (updatedSale.commune_id) fetchPromotions();
  }, [updatedSale.commune_id]);

  useEffect(() => {
    if (updatedSale.promotion_id) {
      fetchInstallationAmount(updatedSale.promotion_id);
    }
  }, [updatedSale.promotion_id]);

  useEffect(() => {
    fetchReasons();
  }, [updatedSale.sale_status_id]);

  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedSale((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSale = async (e, recaptchaToken) => {
    e.preventDefault();

    // Verifica que el token no sea undefined
    if (!recaptchaToken) {
      console.error('El token de reCAPTCHA es undefined o null');
      setUpdateMessage('Error al obtener el token de reCAPTCHA. Por favor, inténtalo de nuevo.');
      return;
    }

    if (roleId === 3) {
      updatedSale.sale_status_id = 1;
      updatedSale.sale_status_reason_id = 22;
    }

    // Mostrar alerta y pedir servicio_id si sale_status_id === 2
    if (updatedSale.sale_status_id === '2') {
      let serviceId;
      do {
        serviceId = prompt('Por favor, ingresa el Número de Orden para continuar con la actualización del estado.');
        if (serviceId === null) {
          return;
        }
      } while (serviceId.trim() === '');

      updatedSale.service_id = serviceId;
    } else {
      updatedSale.service_id = updatedSale.service_id ? updatedSale.service_id : null;
    }

   // Función para verificar si hay cambios en los campos
   const hasFieldChanges = () => {
    const relevantFields = { ...updatedSale };
    const originalFields = { ...sale };
    
    // Eliminar campos que no queremos comparar
    delete relevantFields.other_images;
    delete originalFields.other_images;
    
    return JSON.stringify(relevantFields) !== JSON.stringify(originalFields);
  };

  // Función para verificar si hay cambios en las imágenes
  const hasImageChanges = () => {
    if (newImages && newImages.length > 0) {
      return true;
    }

    // Verificar cambios en imágenes existentes
    const originalImagesCount = sale.other_images ? sale.other_images.split(',').length : 0;
    return existingImages.length !== originalImagesCount;
  };

  // Verificar si hay algún cambio
  const hasAnyChanges = hasFieldChanges() || hasImageChanges();
  // Solo mostrar confirmación si no hay cambios
  if (!hasAnyChanges) {
    const confirmar = window.confirm(
      '¿Estás seguro que deseas actualizar la venta?'
    );
    if (!confirmar) return;
  }
    if (updatedSale.sale_status_reason_id === "") {
      setUpdateMessage("Debe seleccionar un motivo");
      return;
    }


    // Nueva lógica de confirmación para todos los roles
    if (JSON.stringify(updatedSale) === JSON.stringify(sale)) {
      const confirmar = window.confirm(
        '¿Estás seguro que deseas actualizar la venta?'
      );
      if (!confirmar) return;
    }
    
    if (updatedSale.sale_status_reason_id === "") {
      setUpdateMessage("Debe seleccionar un motivo");
      return;
    }

    const phoneNumber = updatedSale.client_phone !== null ? updatedSale.client_phone.replace('+56', '') : null;
    const phoneNumber2 = updatedSale.client_secondary_phone !== null ? updatedSale.client_secondary_phone.replace('+56', '') : null;
    const email = updatedSale.client_email || null;
    const street = updatedSale.street === '' || updatedSale.street === null ? null : updatedSale.street;
    const number = updatedSale.number === '' || updatedSale.number === null ? null : updatedSale.number;
    const geoReference = updatedSale.geo_reference === '' || updatedSale.geo_reference === null ? null : updatedSale.geo_reference;
    const departmentOfficeFloor = updatedSale.department_office_floor === '' || updatedSale.department_office_floor === null ? null : updatedSale.department_office_floor;
    const additionalComments = updatedSale.additional_comments === '' || updatedSale.additional_comments === null ? null : updatedSale.additional_comments;

    const formData = new FormData();
  
    // Agregar todos los campos del formulario al FormData
    formData.append('service_id', updatedSale.service_id ? updatedSale.service_id : '');
    formData.append('sales_channel_id', updatedSale.sales_channel_id);
    formData.append('client_first_name', updatedSale.client_first_name);
    formData.append('client_last_name', updatedSale.client_last_name);
    formData.append('client_rut', updatedSale.client_rut);
    formData.append('client_email', email === '' || email === null ? '' : email);
    formData.append('client_phone', phoneNumber === '' || phoneNumber === null ? '' : phoneNumber);
    formData.append('client_secondary_phone', phoneNumber2 === '' || phoneNumber2 === null ? '' : phoneNumber2);
    formData.append('region_id', updatedSale.region_id);
    formData.append('commune_id', updatedSale.commune_id);
    formData.append('street', street === null ? '' : street);
    formData.append('number', number === null ? '' : number);
    formData.append('department_office_floor', departmentOfficeFloor === null ? '' : departmentOfficeFloor);
    formData.append('geo_reference', geoReference === null ? '' : geoReference);
    formData.append('promotion_id', updatedSale.promotion_id);
    formData.append('is_priority', updatedSale.is_priority);
    formData.append('sale_status_id', updatedSale.sale_status_id);
    formData.append('company_id', updatedSale.company_id);
    formData.append('sale_status_reason_id', updatedSale.sale_status_reason_id);
    formData.append('installation_amount_id', updatedSale.promotion_id);
    formData.append('additional_comments', additionalComments === null ? '' : additionalComments);
  
 // Manejar imágenes existentes de manera diferente
 if (existingImages.length > 0) {
  // Si hay imágenes existentes, las enviamos como string
  formData.append('existing_images', existingImages.join(','));
}

// Manejar nuevas imágenes
if (newImages.length > 0) {
  newImages.forEach((file) => {
    formData.append('other_images', file);
  });
}

// Si no hay nuevas imágenes y las existentes no han cambiado
// enviamos un indicador para mantener las imágenes actuales
if (newImages.length === 0 && existingImages.length === sale.other_images?.split(',').length) {
  formData.append('keep_existing_images', 'true');
}
  
    // Agregar el token de reCAPTCHA al FormData
    formData.append('recaptchaToken', recaptchaToken);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sales/update/${currentSaleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const responseData = await response.json();
      setSale(responseData);
      setUpdatedSale(responseData);
      setIsEditing(false);
      setUpdateMessage('Venta actualizada con éxito!');

      await fetchSaleDetails();
    } catch (error) {
      setIsEditing(true);
      setUpdateMessage(`Error al actualizar: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUpdatedSale(sale);
  };

  // Render functions
  const renderPriorityToggle = () => {
    if (roleId !== 1 && roleId !== 2) return null;
  
    return (
      <div className="priority-toggle">
        <strong>Prioridad:</strong>
        <button onClick={handlePriorityToggle} className="priority-button" style={{ backgroundColor: 'transparent', border: 'none', width: '7%', marginBottom: 10 }}>
          <FontAwesomeIcon 
            icon={sale.is_priority === 1 ? faStarSolid : faStar} 
            style={{ color: sale.is_priority === 1 ? 'gold' : 'gray' }}
          />
        </button>
      </div>
    );
  };

  // Renderiza el formulario con onSubmitWithRecaptcha
  const renderEditForm = () => (
    <div className="sale-detail-form">
      {renderFormFields()}
    </div>
  );

  const renderFormFields = () => (
    <div className="sale-detail-fields-group">
      {renderInputField("Nombres", "client_first_name", "text")}
      {renderInputField("Apellidos", "client_last_name", "text")}
      {renderInputField("RUT", "client_rut", "text")}
      {renderInputField("Correo Electrónico", "client_email", "email")}
      {renderInputField("Número de Teléfono", "client_phone", "text")}
      {renderInputField("Número Secundario (Opcional)", "client_secondary_phone", "text")}
      {renderSelectField("Región", "region_id", regions, "region_id", "region_name")}
      {renderSelectField("Comuna", "commune_id", communes, "commune_id", "commune_name")}
      {renderInputField("Calle/Avenida", "street", "text")}
      {renderInputField("Número", "number", "text")}
      {renderInputField("Departamento/Oficina/Piso", "department_office_floor", "text")}
      {renderTextarea("Georeferencia", "geo_reference", 2)}
      {renderSelectField("Promoción", "promotion_id", promotions, "promotion_id", "promotion")}
      {renderReadOnlyField("Monto de Instalación", installationAmount)}
      <div className='space'></div>
      {[1, 2, 3, 4, 5].includes(roleId) && renderEditableSaleStatus()}
      {[1, 2, 4, 5].includes(roleId) && renderEditableReason()}
      {/* Solo mostrar el campo si el rol NO es 3 ni 4 */}
      {updatedSale.service_id ? (
      renderInputField("Número Orden(Wisphub)", "service_id", "text")
    ) : (
      <div className="space"></div>
    )}
      {(roleId === 1 || roleId === 2 || roleId === 3) 
        ? renderImageInputs ("Archivos adjuntos", "other_images")
        : renderTextarea("Comentarios adicionales", "additional_comments")
      }
    </div>
    
  );

  const renderInputField = (label, name, type = "text", editable = true, required = false) => (
    <div className="sale-detail-field-group">
      <label>{label}:
        <input
          type={type}
          name={name}
          value={updatedSale[name] !== null ? updatedSale[name] : ""}
          onChange={handleChange}
          readOnly={roleId === 5 || !editable}
          required={required}
        />
      </label>
    </div>
  );

  const renderSelectField = (label, name, options, valueKey, labelKey) => (
    <div className="sale-detail-field-group">
      <strong>{label}:</strong>
      <select 
        name={name} 
        value={updatedSale[name] || ''} 
        onChange={handleChange} 
        disabled={roleId === 5}
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option[valueKey]} value={option[valueKey]}>
            {option[labelKey]}
          </option>
        ))}
      </select>
    </div>
  );

  const renderTextarea = (label, name, rows = 2) => (
    <div className="sale-detail-field-group comentarios-adicionales">
      <label>{label}:</label>
      <textarea
        name={name}
        value={updatedSale[name] !== null ? updatedSale[name] : ""}
        onChange={handleChange}
        rows={rows}
        style={{ resize: 'none' }}
        onInput={(e) => {
          e.target.rows = Math.min(10, Math.max(2, e.target.scrollHeight / 20));
        }}
      />
    </div>
  );

  const renderReadOnlyField = (label, value) => (
    <div className="sale-detail-field-group">
      <label>{label}:</label>
      <input
        type="text"
        value={loading ? 'Cargando...' : value}
        readOnly
      />
    </div>
  );

  const renderEditableSaleStatus = () => (
    <div className="sale-detail-field-group">
      {roleId !== 3 && (
        <>
          {[1, 2, 4, 5].includes(roleId) && (
            <strong>Estado de Venta:</strong>
          )}
          <select
            name="sale_status_id"
            value={updatedSale.sale_status_id || ''}
            onChange={handleChange}
          >
            <option value="">Selecciona un estado</option>
            {saleStatuses
            .filter(status => !(roleId === 4 && status.sale_status_id === 1)) // Filtrar estado 1 si roleId es 4
            .map((saleStatus) => (
              <option key={saleStatus.sale_status_id} value={saleStatus.sale_status_id}>
                {saleStatus.status_name}
              </option>
            ))}
          </select>
        </>
      )}
      {(roleId === 1 || roleId === 2 || roleId === 3)  && (
        renderTextarea("Comentarios adicionales", "additional_comments")
      )}
    </div>
  );
  

  const renderEditableReason = () => (
    <div className="sale-detail-field-group">
      <strong>Motivo:</strong>
      <select
        name="sale_status_reason_id"
        value={updatedSale.sale_status_reason_id || ''}
        onChange={handleChange}
      >
        <option value="">Selecciona un motivo</option>
        {reasons.map((reason) => (
          <option key={reason.sale_status_reason_id} value={reason.sale_status_reason_id}>
            {reason.reason_name}
          </option>
        ))}
      </select>
    </div>
  );
  

  const renderImageInputs = () => (
    <div className="sale-detail-field-group">
      <label>Imágenes:</label>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          name="other_images"
          multiple
          onChange={handleImageUpload}
          accept="image/*, application/pdf"
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          style={{
            padding: '10px 5px',
            width: '8rem',
            marginLeft: 5,
            backgroundColor: '#99235C',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10
          }}
        >
          Elegir archivos
        </button>
      </div>
      <div className="file-list-container">
        {existingImages.map((image, index) => (
          <div key={`existing-${index}`} className="file-item">
            <a href={image} target="_blank" rel="noopener noreferrer">
              {`Archivo ${index + 1}`}
            </a>
            <button
              type="button"
              onClick={() => handleDeleteExistingImage(index)}
              className="delete-button-files"
            >
              X
            </button>
          </div>
        ))}
        {newImages.map((file, index) => (
          <div key={`new-${index}`} className="file-item">
            <span>{`Archivo ${existingImages.length + index + 1} (Nuevo)`}</span>
            <button
              type="button"
              onClick={() => handleDeleteNewImage(index)}
              className="delete-button-files"
            >
              X
            </button>
          </div>
        ))}
      </div>
      <p>Total de archivos: {existingImages.length + newImages.length}/5</p>
    </div>
  );

  const renderSaleDetails = () => (
    <>
      {renderPriorityToggle()}
      <div className="sale-detail-fields-group">
       <div className="sale-detail-field-group">
       <strong>Fecha de Ingreso:</strong> 
        {sale && sale.created_at ? (
          <p>{(() => {
            const date = sale.created_at.split('T')[0].split('-');
            const time = sale.created_at.split('T')[1].split('.')[0];
            return `${date[2]}-${date[1]}-${date[0]}, ${time}`;
          })()}</p>
        ) : (
          <p>No hay fecha de ingreso disponible.</p>
        )}
      </div>
        <div className='space'></div>
        <div className='space'></div>
        <div className="executive-info">
          {sale.executive && (
            <div>
              <strong>{sale.executive.role?.role_name || 'Rol no especificado'}</strong>
              <ul>
                <li>Nombre: {sale.executive.first_name} {sale.executive.last_name}</li>
                <li>Rut: {sale.executive.rut}</li>
                <li>Email: {sale.executive.email}</li>
                <li>Celular: {sale.executive.phone_number}</li>
                {sale.executive.company && <li>Empresa: {sale.executive.company.company_name}</li>}
                {sale.executive.salesChannel && <li>Canal de ventas: {sale.executive.salesChannel.channel_name}</li>}
                {sale.executive.contract && <li>Tipo de Contrato: {sale.executive.contract.contract_name}</li>}
              </ul>
            </div>
          )}
          {!sale.executive && sale.admin && (
            <div>
              <strong>{sale.admin.role?.role_name || 'Rol no especificado'}</strong>
              <ul>
                <li>Nombre: {sale.admin.first_name} {sale.admin.last_name}</li>
                <li>Rut: {sale.admin.rut}</li>
                <li>Email: {sale.admin.email}</li>
                <li>Celular: {sale.admin.phone_number}</li>
                {sale.admin.company && <li>Empresa: {sale.admin.company.company_name}</li>}
                {sale.admin.salesChannel && <li>Canal de ventas: {sale.admin.salesChannel.channel_name}</li>}
              </ul>
            </div>
          )}
          {!sale.executive && !sale.admin && sale.superadmin && (
            <div>
              <strong>{sale.superadmin.role?.role_name || 'Rol no especificado'}</strong>
              <ul>
                <li>Nombre: {sale.superadmin.first_name} {sale.superadmin.last_name}</li>
                <li>Rut: {sale.superadmin.rut}</li>
                <li>Email: {sale.superadmin.email}</li>
                <li>Celular: {sale.superadmin.phone_number}</li>
                {sale.superadmin.company && <li>Empresa: {sale.superadmin.company.company_name}</li>}
                {sale.superadmin.salesChannel && <li>Canal de ventas: {sale.superadmin.salesChannel.channel_name}</li>}
              </ul>
            </div>
          )}
        </div>
        <div className='space'></div>
        <div className='space'></div>
    
        {renderDetailField("Nombres", sale.client_first_name)}
        {renderDetailField("Apellidos", sale.client_last_name)}
        {renderDetailField("RUT", sale.client_rut)}
        {renderDetailField("Correo Electrónico", sale.client_email)}
        {renderDetailField("Número de Teléfono", sale.client_phone)}
        {renderDetailField("Número Secundario (Opcional)", sale.client_secondary_phone)}
        {renderDetailField("Región", sale.region?.region_name)}
        {renderDetailField("Comuna", sale.commune?.commune_name)}
        <div className='space'></div>
        {renderDetailField("Calle/Avenida", sale.street)}
        {renderDetailField("Número casa", sale.number)}
        {renderDetailField("Departamento/Oficina/Piso", sale.department_office_floor)}
        {renderDetailField("Geo Referencia", sale.geo_reference, true)}
        <div className='space'></div>
        <div className='space'></div>
        {renderDetailField("Promoción", sale.promotion?.promotion)}
        {renderDetailField("Monto de Instalación", installationAmount)}
        {/* Solo mostrar el número de orden si el rol NO es 3 */}
        {roleId !== 3 && renderDetailField("Número de Orden", sale.service_id)}
        {/* Agregar espacio antes del Estado de la Venta solo cuando es roleId 3 */}
        {roleId === 3 && <div className='space'></div>}
        {renderDetailField("Estado de la Venta", sale.saleStatus?.status_name)}
        {renderDetailField("Motivo", sale.reason?.reason_name)}
        {roleId === 3 && <div className='space'></div>}
        {/* El espacio solo se muestra si NO es roleId 3 */}
        {roleId !== 3 && <div className='space'></div>}
        {renderDetailField("Comentarios Adicionales", sale.additional_comments)}
      </div>
    
      <div className="sale-detail-field-group">
      <div className="sale-detail-images">
          <strong>Imágenes:</strong>
          {sale.other_images_url && sale.other_images_url.length > 0 ? (
            <>
              <p>{sale.other_images_url.length === 1 ? "Imagen adjunta:" : "Imágenes adjuntas:"}</p>
              {sale.other_images_url.map((image, index) => (
                <div key={index} style={{marginTop: '10px'}}>
                  <FontAwesomeIcon icon={faImage} style={{fontSize: '24px', color: '#99235C'}} />
                  <a href={image} target="_blank" rel="noopener noreferrer" style={{marginLeft: '5px'}}>
                    Ver archivo {index + 1}
                  </a>
                </div>
              ))}
              <button onClick={handleDownloadAllImages} style={{marginTop: '10px'}}>
                <FontAwesomeIcon icon={faDownload} style={{marginRight: '5px'}} />
                Descargar imágen(es)
              </button>
            </>
          ) : (
            <p>No hay imágenes adjuntadas</p>
          )}
        </div>
      </div>
    </>
  );

  const renderDetailField = (label, value, isGeoReference = false) => (
    <div className="sale-detail-field-group geo">
      <strong>{label}:</strong> 
      {isGeoReference ? (
        <a href={`https://www.google.com/maps/place/${value}`} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        <p>{value}</p>
      )}
    </div>
  );
  
  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!sale) {
    return <div>No details found for this sale.</div>;
  }
  
  return (
    <div className="sale-detail-page">
      <button className='back' onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeftLong} style={{ marginRight: '5px' }} />
        Atrás
      </button>
      <h2>{roleId === 4 ? 'Validar venta' : 'Detalle venta'}</h2>
      {isEditing ? renderEditForm() : renderSaleDetails()}

      {(roleId === 3 && updatedSale.sale_status_id === 4) && (
        <div className="update-message" style={{marginTop: 20}}>
          Atención: Si deseas reingresar la venta, haz clic en el botón "Reingresar" para volver a enviar la venta. Recuerda verificar cuidadosamente los datos para evitar errores.
        </div>
      )}

      <div className='button-group'>
        {isEditing && (
          <button onClick={(e) => onSubmitWithRecaptcha(e, handleUpdateSale)}>
            {roleId === 3 ? "Reingresar" : "Actualizar"}
          </button>
        )}
        {((roleId !== 3 && roleId !== 6) || (roleId === 3 && sale.sale_status_id === 4)) && (
          <button onClick={() => {
            if (isEditing) {
              handleCancelEdit();
            } else {
              setIsEditing(true);
            }
          }}>
            {isEditing ? "Cancelar" : "Editar"}
          </button>
        )}
      </div>
      {updateMessage && <div className="update-message">{updateMessage}</div>}
    </div>
  );
};

export default withAuthorization(withRecaptcha(DetalleVentaPage, 'submit_sale'), [1, 2, 3, 4, 5, 6]);