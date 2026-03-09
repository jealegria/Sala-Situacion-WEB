import React from 'react';

const PlaceholderPage = ({ title }) => {
    return (
        <div className="space-y-6">
            <div className="h-[500px] bg-[#1c2128] border border-[#30363d] rounded-xl flex flex-col items-center justify-center border-dashed">
                <div className="w-16 h-16 rounded-full bg-[#1c2128] border-2 border-[#30363d] flex items-center justify-center mb-4 text-[#7d8590]">
                    🚧
                </div>
                <p className="text-[#7d8590] text-xl font-medium">Módulo en construcción</p>
                <p className="text-[#7d8590]/60 mt-2">Estamos trabajando en esta sección</p>
            </div>
        </div>
    );
};

export default PlaceholderPage;
