import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CalendarDays, Loader2, Activity, Hash, TrendingUp } from 'lucide-react';

const ServiceStats = ({ title, dailyAvg, monthlyAvg, totalYear, icon: Icon, colorClass }) => (
    <div className="bg-[#1c2128]/50 border border-[#30363d] rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group transition-all hover:bg-[#1c2128]/80">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#2f81f7]/50 group-hover:bg-[#2f81f7] transition-colors"></div>
        
        <div className="flex items-center gap-4 mb-6">
            <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 shadow-inner`}>
                <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[#e6edf3] font-ibm-plex">{title}</h2>
                <p className="text-[10px] text-[#7d8590] font-medium tracking-widest uppercase opacity-70">Métricas Históricas 2025</p>
            </div>
        </div>
        
        <div className="space-y-6">
            <div className="bg-[#30363d]/20 p-4 rounded-xl border border-[#30363d]/50">
                <div className="flex items-center gap-2 mb-1">
                    <Hash size={14} className="text-[#2f81f7]" />
                    <p className="text-[#8b949e] text-[10px] font-bold uppercase tracking-wider">Total Atenciones 2025</p>
                </div>
                <p className="text-3xl font-black text-[#e6edf3] font-ibm-plex">
                    {totalYear.toLocaleString()}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                    <p className="text-[#8b949e] text-[10px] font-bold uppercase tracking-wider opacity-60">Promedio Diario</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-[#e6edf3]">{Math.round(dailyAvg)}</span>
                        <span className="text-[#7d8590] text-[10px]">at/día</span>
                    </div>
                </div>
                <div className="space-y-0.5">
                    <p className="text-[#8b949e] text-[10px] font-bold uppercase tracking-wider opacity-60">Promedio Mensual</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-[#e6edf3]">{Math.round(monthlyAvg).toLocaleString()}</span>
                        <span className="text-[#7d8590] text-[10px]">at/mes</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const ComparisonCard = ({ title, monthName, year, current, previous }) => {
    const diff = current - previous;
    const percent = previous > 0 ? (diff / previous) * 100 : 0;
    const isIncrease = diff > 0;

    return (
        <div className="bg-[#1c2128]/50 border border-[#30363d] rounded-2xl p-6 backdrop-blur-sm group hover:border-[#2f81f7]/40 transition-all">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-[#8b949e] text-[10px] font-bold uppercase tracking-widest">{title}</h3>
                    <p className="text-[#e6edf3] font-bold text-lg">Resumen de {monthName} {year}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${isIncrease ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {isIncrease ? '↑' : '↓'} {Math.abs(percent).toFixed(1)}%
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[#7d8590] text-[10px] font-bold uppercase tracking-wider mb-1">Total {year}</p>
                        <p className="text-4xl font-black text-[#e6edf3]">{current.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[#7d8590] text-[10px] font-bold uppercase tracking-wider mb-1">Total {year - 1}</p>
                        <p className="text-xl font-bold text-[#8b949e]">{previous.toLocaleString()}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#30363d]/50 flex justify-between items-center">
                    <span className="text-[#7d8590] text-[10px] font-bold uppercase tracking-widest">Diferencia Nominal</span>
                    <span className={`text-sm font-bold ${isIncrease ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {isIncrease ? '+' : ''}{diff.toLocaleString()} atenciones
                    </span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        avg2025: {
            adultos: { daily: 0, monthly: 0, total: 0 },
            pediatria: { daily: 0, monthly: 0, total: 0 }
        },
        comparison: {
            adultos: { current: 0, previous: 0 },
            pediatria: { current: 0, previous: 0 },
            monthName: "",
            year: 0
        },
        loading: true
    });
    const [conexion, setConexion] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            setStats(s => ({ ...s, loading: true }));
            try {
                const get2025Counts = async (serv) => {
                    const { count, error } = await supabase.from('registros_guardia')
                        .select('id', { count: 'exact', head: true })
                        .eq('servicio', serv)
                        .gte('fecha_de_ingreso', '2025-01-01')
                        .lt('fecha_de_ingreso', '2026-01-01');
                    
                    if (error) throw error;
                    return count || 0;
                };

                const [totalA, totalP] = await Promise.all([
                    get2025Counts('Adultos'),
                    get2025Counts('Pediatría')
                ]);

                // --- NUEVA LÓGICA DE COMPARACIÓN ---
                // 1. Obtener fecha límite absoluta
                const { data: latest } = await supabase
                    .from('registros_guardia')
                    .select('fecha_de_ingreso')
                    .order('fecha_de_ingreso', { ascending: false })
                    .limit(1)
                    .single();

                if (!latest) throw new Error("No hay datos");

                const limitDate = new Date(latest.fecha_de_ingreso);
                let targetMonth = limitDate.getMonth();
                let targetYear = limitDate.getFullYear();

                // 2. Verificar si el mes está completo
                const lastDayOfThatMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                if (limitDate.getDate() < lastDayOfThatMonth) {
                    const prevDate = new Date(targetYear, targetMonth - 1, 1);
                    targetMonth = prevDate.getMonth();
                    targetYear = prevDate.getFullYear();
                }

                // 3. Obtener totales mes completo vs año anterior
                const monthStr = String(targetMonth + 1).padStart(2, '0');
                const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
                const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

                const getMonthCount = async (serv, year) => {
                    const start = `${year}-${monthStr}-01`;
                    const end = `${year}-${monthStr}-${lastDayOfMonth} 23:59:59`;
                    const { count } = await supabase.from('registros_guardia')
                        .select('id', { count: 'exact', head: true })
                        .eq('servicio', serv)
                        .gte('fecha_de_ingreso', start)
                        .lte('fecha_de_ingreso', end);
                    return count || 0;
                };

                const [cA, pA, cP, pP] = await Promise.all([
                    getMonthCount('Adultos', targetYear),
                    getMonthCount('Adultos', targetYear - 1),
                    getMonthCount('Pediatría', targetYear),
                    getMonthCount('Pediatría', targetYear - 1)
                ]);

                setStats({
                    avg2025: {
                        adultos: { total: totalA, daily: totalA / 365, monthly: totalA / 12 },
                        pediatria: { total: totalP, daily: totalP / 365, monthly: totalP / 12 }
                    },
                    comparison: {
                        adultos: { current: cA, previous: pA },
                        pediatria: { current: cP, previous: pP },
                        monthName: monthNames[targetMonth],
                        year: targetYear
                    },
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
    }, []);

    if (stats.loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-[#2f81f7]" size={48} />
                <p className="text-[#7d8590] font-medium animate-pulse">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20 px-4">
             {/* Compact Header */}
             <div className="flex flex-col items-start gap-2 py-6 border-b border-[#30363d]">
                <h1 className="text-3xl font-black text-[#e6edf3] font-ibm-plex tracking-tight flex items-center gap-3">
                    <Activity className="text-[#2f81f7]" size={28} />
                    Sala de Situación HPN
                </h1>
                <div className="flex items-center gap-2 text-[#7d8590] text-[10px] font-bold uppercase tracking-widest">
                    <span className={`w-2 h-2 rounded-full ${conexion === 'conectado' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {conexion === 'conectado' ? 'Datos Online' : 'Offline'}
                </div>
             </div>

            {/* Main Stats Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <CalendarDays className="text-[#2f81f7]" size={20} />
                    <h2 className="text-[#e6edf3] font-bold text-lg tracking-widest uppercase">Estadísticas 2025</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ServiceStats 
                        title="Sector Adultos" 
                        totalYear={stats.avg2025.adultos.total}
                        dailyAvg={stats.avg2025.adultos.daily} 
                        monthlyAvg={stats.avg2025.adultos.monthly} 
                        icon={Users} 
                        colorClass="bg-blue-500" 
                    />
                    <ServiceStats 
                        title="Sector Pediatría" 
                        totalYear={stats.avg2025.pediatria.total}
                        dailyAvg={stats.avg2025.pediatria.daily} 
                        monthlyAvg={stats.avg2025.pediatria.monthly} 
                        icon={Users} 
                        colorClass="bg-purple-500" 
                    />
                </div>
            </div>

            {/* Comparison Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <TrendingUp className="text-[#2f81f7]" size={20} />
                    <h2 className="text-[#e6edf3] font-bold text-lg tracking-widest uppercase">Comparativa Interanual</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ComparisonCard 
                        title="Atenciones Adultos"
                        monthName={stats.comparison.monthName}
                        year={stats.comparison.year}
                        current={stats.comparison.adultos.current}
                        previous={stats.comparison.adultos.previous}
                    />
                    <ComparisonCard 
                        title="Atenciones Pediatría"
                        monthName={stats.comparison.monthName}
                        year={stats.comparison.year}
                        current={stats.comparison.pediatria.current}
                        previous={stats.comparison.pediatria.previous}
                    />
                </div>
            </div>
            
            <div className="pt-20 text-center opacity-30">
                <p className="text-[#7d8590] text-[10px] font-bold uppercase tracking-[0.5em]">HPN • Centro de Datos</p>
            </div>
        </div>
    );
};

export default Dashboard;
