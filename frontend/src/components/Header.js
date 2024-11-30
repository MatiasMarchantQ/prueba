import React from 'react';
import './Header.css';

const Header = () => {
    return (
        <header className="login-header">
            <div className="header-content">
                <div className="header-left">
                    <h1>Ventas Canal ISP</h1>
                </div>
                <div className="header-right">
                    <img src="/images/logo-fondomorado.png" alt="Logo" className="header-logo" />
                    <span className="header-ingbell">Ingbell Chile SpA.</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
