import React from 'react';

export default function Navbar({ onNavigate, currentTab, loggedIn }) {
    if (loggedIn) {
        return null;
    }

    return (
        <nav className="visitor-navbar">
            <div className="nav-brand" onClick={() => onNavigate('login')} style={{ cursor: 'pointer' }}>
                🧉 Mate-Mático
            </div>
            <ul>
                <li>
                    <button 
                        type="button" 
                        className={`nav-tab-btn ${currentTab === 'login' ? 'active' : ''}`}
                        onClick={() => onNavigate('login')}
                    >
                        Ingresar
                    </button>
                </li>
                <li>
                    <button 
                        type="button" 
                        className={`nav-tab-btn ${currentTab === 'faqs' ? 'active' : ''}`}
                        onClick={() => onNavigate('faqs')}
                    >
                        Preguntas Frecuentes
                    </button>
                </li>
                <li>
                    <button 
                        type="button" 
                        className={`nav-tab-btn ${currentTab === 'opiniones' ? 'active' : ''}`}
                        onClick={() => onNavigate('opiniones')}
                    >
                        Opiniones
                    </button>
                </li>
            </ul>
        </nav>
    );
}