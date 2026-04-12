import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function Index({ products, categories }) {
    // Estados para controlar as duas Modais
    const [isModalOpen, setIsModalOpen] = useState(false); // Cadastro
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false); // Ajuste
    const [selectedProduct, setSelectedProduct] = useState(null);

    // 1. Form de Cadastro de Novo Produto
    const { 
        data: newData, 
        setData: setNewData, 
        post: postNew, 
        processing: processingNew, 
        reset: resetNew, 
        errors: errorsNew, 
        clearErrors: clearErrorsNew 
    } = useForm({
        name: '',
        category_id: '',
        sku: '',
        cost_price: '',
        sale_price: '',
        minimum_stock: 5,
    });

    // 2. Form de Ajuste de Estoque
    const {
        data: adjustData,
        setData: setAdjustData,
        post: postAdjust,
        processing: processingAdjust,
        reset: resetAdjust,
        errors: errorsAdjust
    } = useForm({
        quantity: '',
        type: 'in', // 'in' ou 'out'
        reason: '',
    });

    // Funções de Fechamento
    const closeNewModal = () => {
        setIsModalOpen(false);
        clearErrorsNew();
        resetNew();
    };

    const closeAdjustModal = () => {
        setIsAdjustModalOpen(false);
        resetAdjust();
    };

    // Submits
    const submitNew = (e) => {
        e.preventDefault();
        postNew(route('products.store'), {
            onSuccess: () => closeNewModal(),
        });
    };

    const handleAdjustSubmit = (e) => {
        e.preventDefault();
        postAdjust(route('products.adjust', selectedProduct.id), {
            onSuccess: () => closeAdjustModal(),
        });
    };

    const openAdjustModal = (product) => {
        setSelectedProduct(product);
        setIsAdjustModalOpen(true);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Gestão de Estoque</h2>}
        >
            <Head title="Estoque" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600">Controle seus insumos e produtos para venda.</p>
                        <PrimaryButton onClick={() => setIsModalOpen(true)}>
                            + Novo Produto
                        </PrimaryButton>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Venda</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-500">Nenhum produto cadastrado.</td>
                                    </tr>
                                )}
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            <div className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{product.category?.name || 'Geral'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{product.current_stock} un</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">R$ {product.sale_price}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {product.current_stock <= product.minimum_stock ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Estoque Baixo</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Em dia</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button 
                                                onClick={() => openAdjustModal(product)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Ajustar Estoque
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL 1: CADASTRO DE NOVO PRODUTO */}
            <Modal show={isModalOpen} onClose={closeNewModal}>
                <form onSubmit={submitNew} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Novo Produto</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <InputLabel htmlFor="name" value="Nome do Produto" />
                            <TextInput id="name" className="mt-1 block w-full" value={newData.name} onChange={(e) => setNewData('name', e.target.value)} required />
                            <InputError message={errorsNew.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="category_id" value="Categoria" />
                            <select 
                                id="category_id" 
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={newData.category_id} 
                                onChange={(e) => setNewData('category_id', e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="sku" value="Código / SKU" />
                            <TextInput id="sku" className="mt-1 block w-full" value={newData.sku} onChange={(e) => setNewData('sku', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel htmlFor="cost_price" value="Custo (R$)" />
                            <TextInput id="cost_price" type="number" step="0.01" className="mt-1 block w-full" value={newData.cost_price} onChange={(e) => setNewData('cost_price', e.target.value)} required />
                        </div>
                        <div>
                            <InputLabel htmlFor="sale_price" value="Venda (R$)" />
                            <TextInput id="sale_price" type="number" step="0.01" className="mt-1 block w-full" value={newData.sale_price} onChange={(e) => setNewData('sale_price', e.target.value)} required />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeNewModal}>Cancelar</SecondaryButton>
                        <PrimaryButton disabled={processingNew}>Salvar Produto</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: AJUSTE DE ESTOQUE (ENTRADA/SAÍDA) */}
            <Modal show={isAdjustModalOpen} onClose={closeAdjustModal}>
                <form onSubmit={handleAdjustSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Ajustar Estoque</h2>
                    <p className="text-sm text-gray-600 mb-4">Produto: <span className="font-bold">{selectedProduct?.name}</span></p>
                    
                    <div className="space-y-4">
                        <div>
                            <InputLabel value="Tipo de Movimentação" />
                            <div className="flex gap-4 mt-2">
                                <label className="inline-flex items-center">
                                    <input type="radio" value="in" checked={adjustData.type === 'in'} onChange={(e) => setAdjustData('type', e.target.value)} className="text-indigo-600 focus:ring-indigo-500" />
                                    <span className="ml-2 text-sm text-gray-700">Entrada (Compra)</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input type="radio" value="out" checked={adjustData.type === 'out'} onChange={(e) => setAdjustData('type', e.target.value)} className="text-indigo-600 focus:ring-indigo-500" />
                                    <span className="ml-2 text-sm text-gray-700">Saída (Uso/Perda)</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="quantity" value="Quantidade" />
                            <TextInput id="quantity" type="number" className="mt-1 block w-full" value={adjustData.quantity} onChange={(e) => setAdjustData('quantity', e.target.value)} required />
                            <InputError message={errorsAdjust.quantity} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reason" value="Motivo / Observação" />
                            <TextInput id="reason" className="mt-1 block w-full" value={adjustData.reason} onChange={(e) => setAdjustData('reason', e.target.value)} placeholder="Ex: Compra com fornecedor X" required />
                            <InputError message={errorsAdjust.reason} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeAdjustModal}>Cancelar</SecondaryButton>
                        <PrimaryButton disabled={processingAdjust} className={adjustData.type === 'out' ? 'bg-red-600 hover:bg-red-700' : ''}>
                            Confirmar Ajuste
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}