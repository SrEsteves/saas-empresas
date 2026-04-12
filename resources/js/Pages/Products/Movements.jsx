import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Movements({ movements, filters }) {
    // Iniciamos o estado com os filtros que vieram da URL (ou vazio)
    const [values, setValues] = useState({
        search: filters.search || '',
        type: filters.type || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    // Atualiza o estado enquanto o usuário digita
    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    // Dispara a busca recarregando a página com os novos parâmetros na URL
    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('stock.movements'), values, {
            preserveState: true,
            replace: true,
        });
    };

    // Limpa todos os filtros e busca de novo
    const clearFilters = () => {
        router.get(route('stock.movements'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Extrato de Estoque</h2>}
        >
            <Head title="Movimentações de Estoque" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* BARRA DE FILTROS */}
                    <div className="bg-white p-4 shadow sm:rounded-lg border border-gray-200">
                        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="search" value="Buscar Produto" />
                                <TextInput 
                                    id="search" 
                                    name="search"
                                    type="text" 
                                    className="mt-1 block w-full" 
                                    placeholder="Ex: Shampoo"
                                    value={values.search} 
                                    onChange={handleChange} 
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="type" value="Tipo" />
                                <select 
                                    id="type" 
                                    name="type"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={values.type}
                                    onChange={handleChange}
                                >
                                    <option value="">Todos</option>
                                    <option value="in">Apenas Entradas</option>
                                    <option value="out">Apenas Saídas</option>
                                </select>
                            </div>

                            <div>
                                <InputLabel htmlFor="start_date" value="Data Inicial" />
                                <TextInput 
                                    id="start_date" 
                                    name="start_date"
                                    type="date" 
                                    className="mt-1 block w-full" 
                                    value={values.start_date} 
                                    onChange={handleChange} 
                                />
                            </div>

                            <div className="flex gap-2">
                                <PrimaryButton type="submit" className="w-full justify-center">
                                    Filtrar
                                </PrimaryButton>
                                {(values.search || values.type || values.start_date || values.end_date) && (
                                    <SecondaryButton onClick={clearFilters} type="button" className="px-3" title="Limpar Filtros">
                                        &times;
                                    </SecondaryButton>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* TABELA DE RESULTADOS */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {movements.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">Nenhuma movimentação encontrada com estes filtros.</td>
                                    </tr>
                                )}
                                {movements.data.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 text-sm text-gray-500 italic">
                                            {new Date(movement.created_at).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {movement.product?.name || 'Produto Removido'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {movement.type === 'in' ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Entrada</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Saída</span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {movement.reason}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                        <Link href={route('products.index')} className="text-sm text-indigo-600 hover:underline">
                            &larr; Voltar para lista de produtos
                        </Link>
                        <span className="text-sm text-gray-500">Mostrando {movements.data.length} registros</span>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}