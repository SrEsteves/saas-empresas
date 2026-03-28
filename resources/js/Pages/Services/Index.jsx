import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function Index({ services }) {
    const { props } = usePage();
    const flash = props.flash || {};

    // 1. Formulário de CRIAÇÃO
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        duration_minutes: '',
        price: '',
    });

    // 2. Estados de EDIÇÃO
    const [editingService, setEditingService] = useState(null);
    const editForm = useForm({
        name: '',
        duration_minutes: '',
        price: '',
        is_active: true,
    });

    // 3. Estados do MODAL DE CONFIRMAÇÃO (Novo!)
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        action: '', // 'inactivate' ou 'reactivate'
        service: null
    });

    // --- FUNÇÕES DE CRIAÇÃO E EDIÇÃO ---
    const submit = (e) => {
        e.preventDefault();
        post(route('services.store'), { onSuccess: () => reset() });
    };

    const openEditModal = (service) => {
        setEditingService(service);
        editForm.setData({
            name: service.name,
            duration_minutes: service.duration_minutes,
            price: service.price,
            is_active: service.is_active === 1 || service.is_active === true,
        });
        editForm.clearErrors();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('services.update', editingService.id), {
            onSuccess: () => setEditingService(null),
        });
    };

    // --- FUNÇÕES DE CONFIRMAÇÃO (Substituindo o alert nativo) ---
    const openConfirmDialog = (action, service) => {
        setConfirmDialog({ isOpen: true, action, service });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({ isOpen: false, action: '', service: null });
    };

    const executeAction = () => {
        if (confirmDialog.action === 'inactivate') {
            router.delete(route('services.destroy', confirmDialog.service.id), {
                onSuccess: () => closeConfirmDialog()
            });
        } else if (confirmDialog.action === 'reactivate') {
            router.put(route('services.update', confirmDialog.service.id), {
                name: confirmDialog.service.name,
                duration_minutes: confirmDialog.service.duration_minutes,
                price: confirmDialog.service.price,
                is_active: true
            }, {
                onSuccess: () => closeConfirmDialog()
            });
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Meus Serviços</h2>}>
            <Head title="Serviços" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            {flash.success}
                        </div>
                    )}

                    {/* Formulário de Cadastro */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <header>
                            <h2 className="text-lg font-medium text-gray-900">Novo Serviço</h2>
                            <p className="mt-1 text-sm text-gray-600">Adicione os serviços que a sua empresa oferece.</p>
                        </header>

                        <form onSubmit={submit} className="mt-6 space-y-6 max-w-xl">
                            <div>
                                <InputLabel htmlFor="name" value="Nome do Serviço" />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                <InputError className="mt-2" message={errors.name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="duration_minutes" value="Duração (minutos)" />
                                    <TextInput id="duration_minutes" type="number" className="mt-1 block w-full" value={data.duration_minutes} onChange={(e) => setData('duration_minutes', e.target.value)} required />
                                    <InputError className="mt-2" message={errors.duration_minutes} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="price" value="Preço (R$)" />
                                    <TextInput id="price" type="number" step="0.01" className="mt-1 block w-full" value={data.price} onChange={(e) => setData('price', e.target.value)} required />
                                    <InputError className="mt-2" message={errors.price} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>Salvar Serviço</PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Lista de Serviços */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Serviços Cadastrados</h2>
                        <div className="space-y-4">
                            {services.length === 0 ? (
                                <p className="text-gray-500">Nenhum serviço cadastrado ainda.</p>
                            ) : (
                                services.map((service) => (
                                    <div key={service.id} className={`border p-4 rounded-md flex justify-between items-center transition hover:shadow-sm ${service.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800">{service.name}</p>
                                                {!service.is_active && (
                                                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Inativo</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{service.duration_minutes} minutos • R$ {service.price}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => openEditModal(service)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium transition">
                                                Editar
                                            </button>
                                            
                                            {service.is_active ? (
                                                <button onClick={() => openConfirmDialog('inactivate', service)} className="text-red-500 hover:text-red-700 text-sm font-medium transition">
                                                    Inativar
                                                </button>
                                            ) : (
                                                <button onClick={() => openConfirmDialog('reactivate', service)} className="text-green-600 hover:text-green-800 text-sm font-medium transition">
                                                    Reativar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE EDIÇÃO */}
            {editingService && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Editar Serviço</h3>
                            <button onClick={() => setEditingService(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                        </div>
                        
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="edit_name" value="Nome do Serviço" />
                                <TextInput id="edit_name" className="mt-1 block w-full" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} required />
                                <InputError className="mt-2" message={editForm.errors.name} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="edit_duration" value="Duração (minutos)" />
                                    <TextInput id="edit_duration" type="number" className="mt-1 block w-full" value={editForm.data.duration_minutes} onChange={(e) => editForm.setData('duration_minutes', e.target.value)} required />
                                    <InputError className="mt-2" message={editForm.errors.duration_minutes} />
                                </div>
                                <div>
                                    <InputLabel htmlFor="edit_price" value="Preço (R$)" />
                                    <TextInput id="edit_price" type="number" step="0.01" className="mt-1 block w-full" value={editForm.data.price} onChange={(e) => editForm.setData('price', e.target.value)} required />
                                    <InputError className="mt-2" message={editForm.errors.price} />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="edit_status" value="Status" />
                                <select 
                                    id="edit_status"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                    value={editForm.data.is_active ? '1' : '0'}
                                    onChange={(e) => editForm.setData('is_active', e.target.value === '1')}
                                >
                                    <option value="1">Ativo (Aparece no Agendamento)</option>
                                    <option value="0">Inativo (Oculto para clientes)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setEditingService(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition">
                                    Cancelar
                                </button>
                                <PrimaryButton disabled={editForm.processing}>
                                    Salvar Alterações
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* NOVO: MODAL DE CONFIRMAÇÃO ELEGANTE */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                        
                        {/* Ícone condicional */}
                        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${confirmDialog.action === 'inactivate' ? 'bg-red-100' : 'bg-green-100'}`}>
                            {confirmDialog.action === 'inactivate' ? (
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            ) : (
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {confirmDialog.action === 'inactivate' ? 'Inativar Serviço?' : 'Reativar Serviço?'}
                        </h3>
                        
                        <p className="text-sm text-gray-500 mb-6">
                            {confirmDialog.action === 'inactivate' 
                                ? `Tem certeza que deseja ocultar "${confirmDialog.service.name}"? Ele não aparecerá mais para novos agendamentos.` 
                                : `Deseja reativar "${confirmDialog.service.name}"? Ele voltará a aparecer na sua agenda.`}
                        </p>

                        <div className="flex justify-center gap-3">
                            <button onClick={closeConfirmDialog} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition w-full">
                                Cancelar
                            </button>
                            <button 
                                onClick={executeAction} 
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition w-full ${confirmDialog.action === 'inactivate' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}