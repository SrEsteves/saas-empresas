import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';

export default function Dashboard({ stats }) {
    const [dates, setDates] = useState(stats.filters);

    const handleFilter = () => {
        router.get(route('dashboard'), dates, { preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Visão Executiva</h2>}>
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* BARRA DE FILTROS DINÂMICOS */}
                    <div className="bg-white p-4 shadow rounded-lg flex items-end gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">De:</label>
                            <TextInput type="date" value={dates.start_date} onChange={e => setDates({...dates, start_date: e.target.value})} className="block w-full" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Até:</label>
                            <TextInput type="date" value={dates.end_date} onChange={e => setDates({...dates, end_date: e.target.value})} className="block w-full" />
                        </div>
                        <button onClick={handleFilter} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                            Atualizar Relatório
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* CARD FATURAMENTO */}
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                            <p className="text-sm font-medium text-gray-500 uppercase">Faturamento Concluído</p>
                            <p className="text-3xl font-bold text-gray-900">R$ {stats.totalRevenue}</p>
                        </div>

                        {/* RANKING FUNCIONÁRIOS */}
                        <div className="bg-white p-6 rounded-lg shadow md:col-span-1">
                            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Top Produtividade (Equipe)</h3>
                            <ul className="space-y-3">
                                {stats.topEmployees.map((emp, i) => (
                                    <li key={i} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700">{i+1}º {emp.name}</span>
                                        <span className="text-green-600 font-bold">R$ {parseFloat(emp.total_revenue).toLocaleString('pt-BR')}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* RANKING PRODUTOS */}
                        <div className="bg-white p-6 rounded-lg shadow md:col-span-1">
                            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Produtos Mais Consumidos</h3>
                            <ul className="space-y-3">
                                {stats.topProducts.map((item, i) => (
                                    <li key={i} className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-700">{item.product?.name}</span>
                                        <span className="text-indigo-600 font-bold">{parseFloat(item.total_consumed)} un</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <p className="text-center text-xs text-gray-400 italic">
                        Dados baseados em agendamentos marcados como "Concluído" no período selecionado.
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}