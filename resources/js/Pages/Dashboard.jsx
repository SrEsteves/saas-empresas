import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';

export default function Dashboard({ stats }) {
    // Estado com segurança para evitar erros de 'undefined'
    const [dates, setDates] = useState({
        start_date: stats?.filters?.start_date || '',
        end_date: stats?.filters?.end_date || '',
    });

    // Formata números para Real Brasileiro (R$)
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('dashboard'), dates, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout 
            header={
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="font-bold text-2xl text-gray-900 leading-tight">Visão Executiva</h2>
                        <p className="text-sm text-gray-500">Resumo financeiro e operacional do seu negócio.</p>
                    </div>
                    
                    {/* Filtro de Período Integrado no Cabeçalho */}
                    <form onSubmit={handleFilter} className="flex items-center gap-2 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                        <TextInput 
                            type="date" 
                            value={dates.start_date} 
                            onChange={e => setDates({...dates, start_date: e.target.value})} 
                            className="text-sm border-none focus:ring-0 w-36" 
                        />
                        <span className="text-gray-300">|</span>
                        <TextInput 
                            type="date" 
                            value={dates.end_date} 
                            onChange={e => setDates({...dates, end_date: e.target.value})} 
                            className="text-sm border-none focus:ring-0 w-36" 
                        />
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </form>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* LINHA 1: KPIs (Key Performance Indicators) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Concluído</p>
                            <p className="text-3xl font-black text-green-600 mt-2">{formatCurrency(stats?.totalRevenue)}</p>
                            <p className="text-[11px] text-gray-400 mt-1">Serviços finalizados no período</p>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket Médio</p>
                            <p className="text-3xl font-black text-gray-800 mt-2">{formatCurrency(stats?.averageTicket)}</p>
                            <p className="text-[11px] text-gray-400 mt-1">Gasto médio por cliente</p>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Atendimentos</p>
                            <p className="text-3xl font-black text-indigo-600 mt-2">{stats?.totalAppointments || 0}</p>
                            <p className="text-[11px] text-gray-400 mt-1">Volume de clientes atendidos</p>
                        </div>
                        
                        <div className={`p-6 rounded-xl shadow-sm flex flex-col justify-between ${stats?.criticalStockCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100'}`}>
                            <p className={`text-xs font-bold uppercase tracking-wider ${stats?.criticalStockCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>Estoque Crítico</p>
                            <p className={`text-3xl font-black mt-2 ${stats?.criticalStockCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                {stats?.criticalStockCount || 0}
                            </p>
                            {stats?.criticalStockCount > 0 ? (
                                <Link href={route('products.index')} className="text-[11px] text-red-600 font-bold hover:underline mt-1">Ver itens esgotando &rarr;</Link>
                            ) : (
                                <p className="text-[11px] text-gray-400 mt-1">Nenhum produto em falta</p>
                            )}
                        </div>
                    </div>

                    {/* LINHA 2: RANKINGS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Card: Produtividade da Equipe */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Top Profissionais</h3>
                            </div>
                            <div className="p-0">
                                {stats?.topEmployees?.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white text-gray-400 text-[10px] uppercase border-b border-gray-100">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold">Colaborador</th>
                                                <th className="px-5 py-3 font-semibold text-center">Atendimentos</th>
                                                <th className="px-5 py-3 font-semibold text-right">Receita Gerada</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stats.topEmployees.map((emp, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-5 py-4 font-medium text-gray-900 flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-300 w-4">{i + 1}º</span>
                                                        {emp.name}
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-gray-500 font-medium">{emp.total_services}</td>
                                                    <td className="px-5 py-4 text-right font-bold text-green-600">{formatCurrency(emp.total_revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-sm">Nenhum atendimento finalizado neste período.</div>
                                )}
                            </div>
                        </div>

                        {/* Card: Consumo de Estoque */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Insumos Mais Utilizados</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                {stats?.topProducts?.length > 0 ? (
                                    stats.topProducts.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-medium text-gray-800">{item.product?.name || 'Produto Removido'}</span>
                                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                                                    {parseFloat(item.total_consumed)} unidades
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                {/* Barrinha visual baseada no item mais consumido (o primeiro) */}
                                                <div 
                                                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                                                    style={{ width: `${(item.total_consumed / stats.topProducts[0].total_consumed) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 text-sm py-4">Nenhuma saída de estoque registrada neste período.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}