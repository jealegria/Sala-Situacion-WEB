import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bed, Ambulance, Calendar, Upload, User } from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Internaciones', path: '/internaciones', icon: <Bed size={20} /> },
        { name: 'Guardia', path: '/guardia', icon: <Ambulance size={20} /> },
        { name: 'Agenda', path: '/agenda', icon: <Calendar size={20} /> },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col z-50">
            <div className="p-6">
                <h1 className="text-xl font-bold text-[#2f81f7] tracking-tight">
                    Sala de Situación <span className="text-[#e6edf3]">HPN</span>
                </h1>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-[#2f81f7]/10 text-[#2f81f7] font-medium'
                                : 'text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#1c2128]'
                            }`
                        }
                    >
                        <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-[#30363d] bg-[#1c2128]/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#30363d] flex items-center justify-center text-[#2f81f7]">
                        <User size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#e6edf3]">Dr. Usuario</span>
                        <span className="text-xs text-[#7d8590]">Hospital PN</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
