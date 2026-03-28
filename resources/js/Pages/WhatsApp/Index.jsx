import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Index({ pendingAppointments }) {
    
    // Função para aceitar
    const handleAccept = (id) => {
        router.post(route('whatsapp.accept', id));
    };

    // Função para recusar
    const handleReject = (id) => {
        if(confirm('Tem certeza que deseja recusar este agendamento?')) {
            router.post(route('whatsapp.reject', id));
        }
    };

    // Função para formatar a data bonitinha
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Central de Atendimento (WhatsApp)</h2>}>
            <Head title="WhatsApp" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm sm:rounded-lg flex overflow-hidden border border-gray-200" style={{ height: '70vh' }}>
                        
                        {/* Lado Esquerdo: Contatos */}
                        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
                            <div className="p-4 bg-gray-100 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-700">Conversas Recentes</h3>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">Bot</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="font-semibold text-gray-800">Assistente Virtual</h4>
                                            <span className="text-xs text-green-600 font-bold">{pendingAppointments.length} msg</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">Agendamentos pendentes...</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lado Direito: A Conversa */}
                        <div className="w-2/3 flex flex-col bg-slate-50">
                            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">Bot</div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Assistente Virtual (Bot)</h4>
                                    <p className="text-xs text-green-500">Online</p>
                                </div>
                            </div>

                            {/* Área de Mensagens (AGORA DINÂMICA) */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                
                                {pendingAppointments.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-10">
                                        Nenhum agendamento pendente no momento.
                                    </div>
                                ) : (
                                    pendingAppointments.map((appointment) => (
                                        <div key={appointment.id} className="flex justify-start">
                                            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md shadow-sm">
                                                <p className="text-sm text-gray-800 mb-3">
                                                    Olá! O cliente <strong>{appointment.client_name}</strong> deseja agendar um horário. Aguardando sua confirmação:
                                                </p>
                                                
                                                <div className="bg-gray-50 p-3 rounded border border-gray-100 mb-4 text-sm">
                                                    <p><strong>Serviço:</strong> {appointment.service?.name}</p>
                                                    <p><strong>Data/Hora:</strong> {formatDateTime(appointment.start_time)}</p>
                                                    <p><strong>Telefone:</strong> {appointment.client_phone}</p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAccept(appointment.id)} className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-indigo-700 transition">
                                                        Aceitar e Agendar
                                                    </button>
                                                    <button onClick={() => handleReject(appointment.id)} className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm font-semibold hover:bg-red-200 transition">
                                                        Recusar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}