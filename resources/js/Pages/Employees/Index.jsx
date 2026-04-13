import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export default function Index({ auth, employees, services }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        service_ids: [],
    });

    // Estados para a modal de edição
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Função para lidar com mudança nos serviços selecionados (para MultiSelect)
    const handleServiceChange = (selectedServices) => {
        setData('service_ids', selectedServices.map(service => service.id));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('employees.store'), {
            onSuccess: () => reset(),
        });
    };

    const deleteEmployee = (id) => {
        if (confirm('Tem certeza que deseja excluir este profissional? Os agendamentos dele ficarão sem dono!')) {
            router.delete(route('employees.destroy', id));
        }
    };

    // Função para abrir a modal de edição
    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        setData({
            name: employee.name,
            service_ids: employee.services.map(s => s.id),
        });
        setIsModalOpen(true);
    };

    // Função para fechar a modal
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
        reset();
    };

    // Função para salvar a edição
    const saveEdit = (e) => {
        e.preventDefault();
        router.put(route('employees.update', editingEmployee.id), {
            name: data.name,
            service_ids: data.service_ids,
        }, {
            onSuccess: () => {
                closeModal();
            },
        });
    };
    // Componente MultiSelect para serviços
    const MultiSelect = ({ selectedServices, onChange, placeholder }) => {
        const [query, setQuery] = useState('');

        const filteredServices = query === ''
            ? services
            : services.filter((service) =>
                service.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''))
            );

        return (
            <Combobox value={selectedServices} onChange={onChange} multiple>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                            displayValue={(services) => services.map(s => s.name).join(', ')}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery('')}
                    >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                            {filteredServices.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    Nenhum serviço encontrado.
                                </div>
                            ) : (
                                filteredServices.map((service) => (
                                    <Combobox.Option
                                        key={service.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                active ? 'bg-teal-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                        value={service}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${
                                                        selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                                >
                                                    {service.name}
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                            active ? 'text-white' : 'text-teal-600'
                                                        }`}
                                                    >
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
        );
    };
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Meus Profissionais</h2>}
        >
            <Head title="Profissionais" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* 1. FORMULÁRIO DE CADASTRO */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <section>
                            <header>
                                <h2 className="text-lg font-medium text-gray-900">Adicionar Novo Profissional</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Cadastre a sua equipe e escolha quais serviços cada um realiza.
                                </p>
                            </header>

                            <form onSubmit={submit} className="mt-6 space-y-6 max-w-xl">
                                <div>
                                    <label className="block font-medium text-sm text-gray-700">Nome do Profissional</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder="Ex: João Silva"
                                    />
                                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-sm text-gray-700 mb-2">Quais serviços ele realiza?</label>
                                    {services.length === 0 ? (
                                        <p className="text-sm text-red-500">Você precisa cadastrar serviços primeiro!</p>
                                    ) : (
                                        <MultiSelect
                                            selectedServices={services.filter(service => data.service_ids.includes(service.id))}
                                            onChange={handleServiceChange}
                                            placeholder="Selecione os serviços..."
                                        />
                                    )}
                                    {errors.service_ids && <p className="mt-2 text-sm text-red-600">{errors.service_ids}</p>}
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={processing || data.service_ids.length === 0}
                                        className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                    >
                                        {processing ? 'Salvando...' : 'Salvar Profissional'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>

                    {/* 2. LISTA DE PROFISSIONAIS CADASTRADOS */}
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <section>
                            <header className="mb-6">
                                <h2 className="text-lg font-medium text-gray-900">Equipe Atual</h2>
                            </header>

                            {employees.length === 0 ? (
                                <p className="text-sm text-gray-500">Nenhum profissional cadastrado ainda.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviços Habilitados</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {employees.map((employee) => (
                                                <tr key={employee.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {employee.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div className="flex flex-wrap gap-2">
                                                            {employee.services.map(service => (
                                                                <span key={service.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                                    {service.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => openEditModal(employee)}
                                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => deleteEmployee(employee.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* MODAL DE EDIÇÃO */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={closeModal}>
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
                                <div className="mt-3">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Profissional</h3>
                                    <form onSubmit={saveEdit} className="space-y-4">
                                        <div>
                                            <label className="block font-medium text-sm text-gray-700">Nome do Profissional</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="block font-medium text-sm text-gray-700 mb-2">Quais serviços ele realiza?</label>
                                            {services.length === 0 ? (
                                                <p className="text-sm text-red-500">Você precisa cadastrar serviços primeiro!</p>
                                            ) : (
                                                <MultiSelect
                                                    selectedServices={services.filter(service => data.service_ids.includes(service.id))}
                                                    onChange={handleServiceChange}
                                                    placeholder="Selecione os serviços..."
                                                />
                                            )}
                                            {errors.service_ids && <p className="mt-2 text-sm text-red-600">{errors.service_ids}</p>}
                                        </div>

                                        <div className="flex justify-end space-x-2 pt-4">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing || data.service_ids.length === 0}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {processing ? 'Salvando...' : 'Salvar Alterações'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </AuthenticatedLayout>
    );
}