import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ambulance, Users, Clock, CalendarDays, Loader2, TrendingUp } from 'lucide-react';

const KpiCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 hover:border-[#2f81f7]/50 transition-all group relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}-500 group-hover:scale-110 transition-transform`}>
            {Icon && <Icon size={64} />}
        </div>
        <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                    {Icon && <Icon size={18} />}
                </div>
                <h3 className="text-[#7d8590] text-sm font-medium">
                    {title}
                </h3>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#e6edf3]">
                    {value || '—'}
                </p>
                {value && value !== '—' && (
                    <span className="text-xs text-green-400 flex items-center gap-0.5 font-medium">
                        <TrendingUp size={12} />
                        +12%
                    </span>
                )}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [servicioFiltro, setServicioFiltro] = useState('General');
    const [stats, setStats] = useState({
        consultas: null,
        adultosCount: 0,
        pediatriaCount: 0,
        topDiags: [],
        loading: true
    });
    const [conexion, setConexion] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            setStats(s => ({ ...s, loading: true }));
            try {
                // Fetch Totals from the new KPI View (Optimized for 170k rows)
                const { data: totalsData, error: totalsError } = await supabase
                    .from('v_kpi_totales')
                    .select('*');

                if (totalsError) throw totalsError;

                const counts = { Adultos: 0, Pediatría: 0 };
                totalsData.forEach(r => {
                    if (r.servicio === 'Adultos') counts.Adultos = r.total;
                    if (r.servicio === 'Pediatría') counts.Pediatría = r.total;
                });

                // Fetch Top Diagnoses filtered by service if needed
                let query = supabase.from('v_top_diagnosticos').select('*');
                if (servicioFiltro !== 'General') {
                    query = query.eq('servicio', servicioFiltro);
                }
                const { data: topData } = await query.limit(5);

                const totalFiltrado = servicioFiltro === 'General' 
                    ? (counts.Adultos + counts.Pediatría) 
                    : (servicioFiltro === 'Adultos' ? counts.Adultos : counts.Pediatría);

                setStats({
                    consultas: totalFiltrado.toLocaleString(),
                    adultosCount: counts.Adultos,
                    pediatriaCount: counts.Pediatría,
                    topDiags: topData || [],
                    loading: false
                });
                setConexion('conectado');

            } catch (err) {
                console.error("Error al cargar dashboard:", err);
                setConexion('error');
                setStats(s => ({ ...s, loading: false }));
            }
        }
        
        loadDashboardData();
    }, [servicioFiltro]); // Re-run when filter changes

    const filtrar = (serv) => setServicioFiltro(serv);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
             {/* Header & Filter */}
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#e6edf3] mb-1 font-ibm-plex">Sala de Situación HPN</h1>
                    <p className="text-[#7d8590] text-sm flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${conexion === 'conectado' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {conexion === 'conectado' ? `Viendo registros de: ${servicioFiltro}` : 'Sin conexión a base de datos'}
                    </p>
                </div>

                <div className="flex bg-[#1c2128] border border-[#30363d] p-1 rounded-xl">
                    {['General', 'Adultos', 'Pediatría'].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => filtrar(opt)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                servicioFiltro === opt 
                                ? 'bg-[#2f81f7] text-white shadow-lg shadow-[#2f81f7]/20' 
                                : 'text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#30363d]'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
             </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Consultas" value={stats.consultas} icon={Ambulance} color="green" />
                <KpiCard title="Sector Adultos" value={stats.adultosCount.toLocaleString()} icon={Users} color="blue" />
                <KpiCard title="Sector Pediatría" value={stats.pediatriaCount.toLocaleString()} icon={Users} color="purple" />
                <KpiCard title="Triage Crítico (Rojo)" value="—" icon={TrendingUp} color="yellow" />
            </div>

            {/* Main Content Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - 2/3 */}
                <div className="lg:col-span-2 h-[450px] bg-[#1c2128] border border-[#30363d] rounded-xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6 text-[#e6edf3] font-semibold">
                        <div className="flex items-center gap-2">
                             <TrendingUp size={20} className="text-[#2f81f7]" />
                             <span>Tendencia Temporal</span>
                        </div>
                        <span className="text-xs font-normal text-[#7d8590]">Filtrado por: {servicioFiltro}</span>
                    </div>
                    <div className="flex-1 border border-[#30363d] border-dashed rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-[#7d8590] text-lg">Próximamente: Gráfico Diario/Mensual</p>
                            <p className="text-[#7d8590]/60 text-sm italic">Conecta Recharts para ver el volumen aquí</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - 1/3 */}
                <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[#e6edf3] font-semibold mb-6 flex items-center gap-2">
                        <Users size={20} className="text-[#2f81f7]" />
                        Top Diagnósticos
                    </h3>
                    <div className="flex-1 space-y-4">
                        {stats.loading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#2f81f7]" size={32} /></div>
                        ) : stats.topDiags.length > 0 ? (
                            <div className="divide-y divide-[#30363d]">
                                {stats.topDiags.map((item, idx) => (
                                    <div key={idx} className="py-3 flex items-center justify-between group cursor-default">
                                        <div className="flex flex-col">
                                            <span className="text-[#e6edf3] text-sm font-medium line-clamp-1 group-hover:text-[#2f81f7] transition-colors uppercase">
                                                {item.diagnostico}
                                            </span>
                                            <span className="text-[#7d8590] text-xs">Código CIE10: {item.cie10_codigo || 'N/A'}</span>
                                        </div>
                                        <div className="bg-[#30363d]/50 px-2 py-1 rounded text-xs text-[#2f81f7] font-bold">
                                            {item.cantidad}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <p className="text-[#7d8590] text-sm italic">No se encontraron datos para los criterios seleccionados.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
