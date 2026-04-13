import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';

export default function Dashboard({ stats }) {
    const [dates, setDates] = useState({
        start_date: stats?.filters?.start_date || '',
        end_date: stats?.filters?.end_date || '',
    });

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('dashboard'), dates, { preserveState: true, replace: true });
    };

    const kpis = [
        {
            label: 'Faturamento',
            value: formatCurrency(stats?.totalRevenue),
            sub: 'Serviços finalizados no período',
            color: 'text-green-600',
            bg: 'bg-green-50',
            iconColor: 'text-green-500',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            label: 'Ticket Médio',
            value: formatCurrency(stats?.averageTicket),
            sub: 'Gasto médio por cliente',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            iconColor: 'text-indigo-500',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            label: 'Atendimentos',
            value: stats?.totalAppointments || 0,
            sub: 'Volume de clientes atendidos',
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            iconColor: 'text-violet-500',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            label: 'Estoque Crítico',
            value: stats?.criticalStockCount || 0,
            sub: stats?.criticalStockCount > 0 ? null : 'Nenhum produto em falta',
            link: stats?.criticalStockCount > 0 ? route('products.index') : null,
            linkLabel: 'Ver itens esgotando →',
            color: stats?.criticalStockCount > 0 ? 'text-red-600' : 'text-gray-700',
            bg: stats?.criticalStockCount > 0 ? 'bg-red-50' : 'bg-gray-50',
            iconColor: stats?.criticalStockCount > 0 ? 'text-red-500' : 'text-gray-400',
            border: stats?.criticalStockCount > 0 ? 'border-red-200' : 'border-gray-100',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className="font-black text-lg text-gray-900 leading-tight tracking-tight">Visão Executiva</h2>
                        <p className="text-xs text-gray-400">Resumo financeiro e operacional do seu negócio.</p>
                    </div>

                    <form onSubmit={handleFilter} className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-gray-200">
                        <TextInput
                            type="date"
                            value={dates.start_date}
                            onChange={e => setDates({ ...dates, start_date: e.target.value })}
                            className="text-sm border-none focus:ring-0 w-32 p-0 bg-transparent"
                        />
                        <span className="text-gray-300 text-xs">→</span>
                        <TextInput
                            type="date"
                            value={dates.end_date}
                            onChange={e => setDates({ ...dates, end_date: e.target.value })}
                            className="text-sm border-none focus:ring-0 w-32 p-0 bg-transparent"
                        />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-md transition flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </form>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.label}
                            className={`bg-white rounded-2xl border ${kpi.border || 'border-gray-100'} p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                                <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.iconColor} flex items-center justify-center`}>
                                    {kpi.icon}
                                </div>
                            </div>
                            <p className={`text-3xl font-black ${kpi.color} leading-none`}>{kpi.value}</p>
                            {kpi.link ? (
                                <Link href={kpi.link} className="text-xs text-red-500 font-semibold hover:underline">
                                    {kpi.linkLabel}
                                </Link>
                            ) : (
                                <p className="text-xs text-gray-400">{kpi.sub}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* RANKINGS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Top Profissionais */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-bold text-gray-800">Top Profissionais</h3>
                            </div>
                        </div>

                        {stats?.topEmployees?.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Colaborador</th>
                                        <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Atend.</th>
                                        <th className="px-5 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Receita</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats.topEmployees.map((emp, i) => (
                                        <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="px-5 py-3.5 flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {i + 1}
                                                </span>
                                                <span className="font-medium text-gray-800">{emp.name}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                    {emp.total_services}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-green-600 text-sm">
                                                {formatCurrency(emp.total_revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="px-5 py-12 text-center text-sm text-gray-400">
                                Nenhum atendimento finalizado neste período.
                            </div>
                        )}
                    </div>

                    {/* Insumos Mais Utilizados */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">Insumos Mais Utilizados</h3>
                        </div>

                        <div className="p-5 space-y-4">
                            {stats?.topProducts?.length > 0 ? (
                                stats.topProducts.map((item, i) => {
                                    const pct = Math.round((item.total_consumed / stats.topProducts[0].total_consumed) * 100);
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className="font-medium text-gray-700 truncate">{item.product?.name || 'Produto Removido'}</span>
                                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-xs flex-shrink-0 ml-2">
                                                    {parseFloat(item.total_consumed)} un.
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-10 text-center text-sm text-gray-400">
                                    Nenhuma saída de estoque registrada neste período.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}