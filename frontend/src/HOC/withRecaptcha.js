// HOC/withRecaptcha.js
import React, { useState } from 'react';
import { useRecaptcha } from '../hooks/useRecaptcha';

const withRecaptcha = (WrappedComponent, action) => {
  return function WithRecaptchaComponent(props) {
    const { executeRecaptcha, recaptchaLoaded } = useRecaptcha();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitWithRecaptcha = async (e, originalSubmit) => {
      e.preventDefault();
      
      if (isSubmitting) return;
      setIsSubmitting(true);
      
      try {
        let token = null;
        let attempts = 0;
        const maxAttempts = 3;
    
        while (!token && attempts < maxAttempts) {
          try {
            token = await executeRecaptcha(action);
            if (token) break;
          } catch (error) {
            attempts++;
            if (attempts === maxAttempts) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
    
        if (!token) {
          alert('No se pudo obtener el token de reCAPTCHA. Por favor, inténtelo de nuevo.');
          return;
        }
        
        await originalSubmit(e, token);
      } catch (error) {
        console.error('Error en reCAPTCHA:', error);
        alert('Ocurrió un error durante la verificación de reCAPTCHA. Por favor, inténtelo de nuevo.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!recaptchaLoaded) {
      return <div>Cargando reCAPTCHA...</div>;
    }

    return (
      <WrappedComponent
        {...props}
        onSubmitWithRecaptcha={handleSubmitWithRecaptcha}
      />
    );
  };
};

export default withRecaptcha;