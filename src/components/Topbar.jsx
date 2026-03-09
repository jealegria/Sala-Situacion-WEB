import React from 'react';
import { useLocation } from 'react-router-dom';

const Topbar = () => {
    const location = useLocation();

    const getPageTitle = (path) => {
        switch (path) {
            case '/': return 'Dashboard';
            case '/internaciones': return 'Internaciones';
            case '/guardia': return 'Guardia';
            case '/agenda': return 'Agenda';
            case '/cargar': return 'Cargar datos';
            default: return 'Sala de Situación';
        }
    };

    return (
        <header className="h-16 bg-[#0f1117]/80 backdrop-blur-md border-b border-[#30363d] flex items-center px-8 sticky top-0 z-40">
            <h2 className="text-lg font-semibold text-[#e6edf3]">
                {getPageTitle(location.pathname)}
            </h2>
        </header>
    );
};

export default Topbar;
