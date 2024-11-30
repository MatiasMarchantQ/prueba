// components/ReCaptchaWrapper.js
import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const ReCaptchaWrapper = ({ children }) => {
  const reCaptchaKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  if (!reCaptchaKey) {
    console.error('REACT_APP_RECAPTCHA_SITE_KEY no está configurada');
    return children;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={reCaptchaKey}
      useRecaptchaNet={true}
      useEnterprise={false}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
        nonce: window.nonce || undefined,
      }}
      container={{
        parameters: {
          badge: 'bottomright',
          size: 'invisible',
          samesite: 'Strict',
          secure: true
        }
      }}
      language="es"
      onError={() => {
        console.error('Error al cargar reCAPTCHA');
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default ReCaptchaWrapper;