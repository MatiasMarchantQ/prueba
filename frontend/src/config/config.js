const config = {
    apiUrl: process.env.REACT_APP_API_URL,
    environment: process.env.REACT_APP_ENV,
    isProduction: process.env.REACT_APP_ENV === 'production',
  };
  
  export default config;