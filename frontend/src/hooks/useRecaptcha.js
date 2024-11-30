// hooks/useRecaptcha.js
import { useCallback, useEffect, useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export const useRecaptcha = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (executeRecaptcha) {
      setRecaptchaLoaded(true);
    }
  }, [executeRecaptcha]);

  const execute = useCallback(
    async (action = 'submit') => {
      if (!executeRecaptcha) {
        console.warn('reCAPTCHA no ha sido cargado aún');
        return null;
      }

      setIsVerifying(true);
      try {
        const token = await executeRecaptcha(action);
        
        if (!token || token.trim() === '') {
          throw new Error('Token de reCAPTCHA inválido');
        }
        
        return token;
      } catch (error) {
        console.error('Error al ejecutar reCAPTCHA:', error);
        throw error;
      } finally {
        setIsVerifying(false);
      }
    },
    [executeRecaptcha]
  );

  return {
    executeRecaptcha: execute,
    recaptchaLoaded,
    isVerifying
  };
};