import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';

export default function Index({ auth, employees, services }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        service_ids: [],
    });

    // Função inteligente para lidar com as caixinhas de marcar (checkboxes)
    const handleCheckboxChange = (e) => {
        const serviceId = parseInt(e.target.value);
        if (e.target.checked) {
            // Se marcou, adiciona o ID na lista
            setData('service_ids', [...data.service_ids, serviceId]);
        } else {
            // Se desmarcou, tira o ID da lista
            setData('service_ids', data.service_ids.filter(id => id !== serviceId));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('employees.store'), {
            onSuccess: () => reset(), // Limpa o formulário se der certo
        });
    };

    const deleteEmployee = (id) => {
        if (confirm('Tem certeza que deseja excluir este profissional? Os agendamentos dele ficarão sem dono!')) {
            router.delete(route('employees.destroy', id));
        }
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
                                        <div className="grid grid-cols-2 gap-4">
                                            {services.map((service) => (
                                                <label key={service.id} className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        value={service.id}
                                                        checked={data.service_ids.includes(service.id)}
                                                        onChange={handleCheckboxChange}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{service.name}</span>
                                                </label>
                                            ))}
                                        </div>
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

                </div>
            </div>
        </AuthenticatedLayout>
    );
}