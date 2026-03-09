import React from 'react';
import { Upload, FileType, Check } from 'lucide-react';

const Cargar = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-[#1c2128] border border-[#30363d] rounded-2xl p-12 flex flex-col items-center text-center space-y-6 group cursor-pointer hover:border-[#2f81f7]/40 transition-all border-dashed">
                <div className="w-20 h-20 rounded-full bg-[#2f81f7]/10 flex items-center justify-center text-[#2f81f7] group-hover:scale-110 transition-transform duration-300">
                    <Upload size={40} />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-[#e6edf3]">
                        Arrastrá tu archivo CSV o Excel acá
                    </h3>
                    <p className="text-[#7d8590]">
                        Soportamos archivos .csv, .xls, .xlsx de reportes hospitalarios
                    </p>
                </div>

                <button className="px-8 py-3 bg-[#2f81f7] hover:bg-[#2f81f7]/80 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-[#2f81f7]/20">
                    Seleccionar archivo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-[#1c2128]/40 border border-[#30363d] rounded-xl flex items-center gap-4">
                    <div className="text-[#2f81f7]"><Check size={20} /></div>
                    <span className="text-[#7d8590] text-sm">Validación de formato</span>
                </div>
                <div className="p-4 bg-[#1c2128]/40 border border-[#30363d] rounded-xl flex items-center gap-4">
                    <div className="text-[#2f81f7]"><Check size={20} /></div>
                    <span className="text-[#7d8590] text-sm">Limpieza automática</span>
                </div>
                <div className="p-4 bg-[#1c2128]/40 border border-[#30363d] rounded-xl flex items-center gap-4">
                    <div className="text-[#2f81f7]"><Check size={20} /></div>
                    <span className="text-[#7d8590] text-sm">Integración directa</span>
                </div>
            </div>
        </div>
    );
};

export default Cargar;
