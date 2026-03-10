import React, { useState } from 'react';
import { Upload, FileType, Check, AlertCircle, Loader2, Play, Copy, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Cargar = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [normalizing, setNormalizing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        setFile(selectedFile);
        setReport(null);
        setError(null);
        
        await analyzeFile(selectedFile);
    };

    const analyzeFile = async (selectedFile) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('http://localhost:8000/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Error al analizar el archivo');

            const data = await response.json();
            setReport(data.report_md);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNormalize = () => {
        setNormalizing(true);
        // Simulación de normalización
        setTimeout(() => {
            setNormalizing(false);
            alert("Normalización completada (Placeholder). Los datos están listos para Supabase.");
        }, 1500);
    };

    const handleCopy = () => {
        if (!report) return;
        navigator.clipboard.writeText(report).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleClear = () => {
        setReport(null);
        setFile(null);
        setError(null);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header / Info */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#e6edf3]">Gestión de Datos Crudos</h1>
                <p className="text-[#7d8590]">Sube reportes en cualquier formato para diagnosticarlos y normalizarlos.</p>
            </div>

            {/* Upload Area */}
            {!report && !loading && (
                <div 
                    className="bg-[#1c2128] border-2 border-[#30363d] border-dashed rounded-2xl p-16 flex flex-col items-center text-center space-y-6 group hover:border-[#2f81f7]/40 transition-all"
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <div className="w-20 h-20 rounded-full bg-[#2f81f7]/10 flex items-center justify-center text-[#2f81f7] group-hover:scale-110 transition-transform duration-300">
                        <Upload size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-[#e6edf3]">
                            Arrastrá tu archivo acá o hacé click
                        </h3>
                        <p className="text-[#7d8590]">CSV, Excel o HTML legado de guardia/agenda</p>
                    </div>
                    <input 
                        id="file-input"
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept=".csv,.xlsx,.xls,.txt,.tsv"
                    />
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-[#1c2128] border border-[#30363d] rounded-2xl p-16 flex flex-col items-center space-y-4">
                    <Loader2 className="animate-spin text-[#2f81f7]" size={48} />
                    <p className="text-[#e6edf3] font-medium text-lg">Analizando estructura del archivo...</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            {/* Report Content */}
            {report && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="flex items-center justify-between bg-[#1c2128] p-4 rounded-xl border border-[#30363d]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                                <Check size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-[#e6edf3]">{file?.name}</h4>
                                <p className="text-xs text-[#7d8590]">Diagnóstico completado exitosamente</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleClear}
                                className="px-3 py-2 text-sm text-[#7d8590] hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2"
                                title="Limpiar reporte"
                            >
                                <Trash2 size={16} />
                                Limpiar
                            </button>
                            <button 
                                onClick={handleCopy}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border ${copied ? 'border-green-500 text-green-500' : 'border-[#30363d] text-[#e6edf3] hover:bg-white/5'}`}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? '¡Copiado!' : 'Copiar Markdown'}
                            </button>
                            <button 
                                onClick={handleNormalize}
                                disabled={normalizing}
                                className="px-6 py-2 bg-[#2f81f7] hover:bg-[#2f81f7]/80 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#2f81f7]/20"
                            >
                                {normalizing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                                {normalizing ? 'Normalizar Datos' : 'Normalizar'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-8 overflow-auto max-h-[600px] prose prose-invert max-w-none shadow-2xl">
                        <ReactMarkdown>{report}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Features Info */}
            {!report && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-[#1c2128]/40 border border-[#30363d] rounded-2xl space-y-3">
                        <div className="text-[#2f81f7]"><FileType size={24} /></div>
                        <h4 className="text-[#e6edf3] font-semibold">Detección de Tipos</h4>
                        <p className="text-[#7d8590] text-sm">Identifica automáticamente si es CSV real, Excel o HTML disfrazado.</p>
                    </div>
                    <div className="p-6 bg-[#1c2128]/40 border border-[#30363d] rounded-2xl space-y-3">
                        <div className="text-[#2f81f7]"><Check size={24} /></div>
                        <h4 className="text-[#e6edf3] font-semibold">Análisis de Integridad</h4>
                        <p className="text-[#7d8590] text-sm">Detecta nulos, tipos de datos y columnas con caracteres especiales.</p>
                    </div>
                    <div className="p-6 bg-[#1c2128]/40 border border-[#30363d] rounded-2xl space-y-3">
                        <div className="text-[#2f81f7]"><Upload size={24} /></div>
                        <h4 className="text-[#e6edf3] font-semibold">Listo para Normalizar</h4>
                        <p className="text-[#7d8590] text-sm">Prepara los datos para la carga final a Supabase mediante normalización.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cargar;
