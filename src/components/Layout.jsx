import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#0f1117] flex">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <Topbar />
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
