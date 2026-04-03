import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';

// Importações do FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Index({ appointments, services }) {
    const { props } = usePage();
    const flash = props.flash || {};

    // Estados para a Modal de NOVO agendamento
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estados para a Modal de DETALHES
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Estado para a Modal de CONFIRMAÇÃO DE CANCELAMENTO
    const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
    
    // NOVO ESTADO: Guarda o motivo do cancelamento
    const [cancelReason, setCancelReason] = useState('');

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        service_id: '',
        client_name: '',
        client_phone: '',
        start_time: '',
    });

    const closeModal = () => {
        setIsModalOpen(false);
        clearErrors();
        reset();
    };

    // 🛠️ CORREÇÃO 1: Paramos de forçar o "null" aqui para não perder os dados
    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('appointments.store'), { onSuccess: () => closeModal() });
    };

    const handleDateClick = (info) => {
        const formattedDate = info.dateStr.substring(0, 16);
        setData('start_time', formattedDate);
        setIsModalOpen(true);
    };

    const handleEventDrop = (info) => {
        const formattedDate = info.event.startStr.substring(0, 16);
        router.put(route('appointments.update', info.event.id), {
            start_time: formattedDate
        }, {
            preserveScroll: true,
            onError: (err) => {
                alert(err.start_time || 'Erro ao mover agendamento.');
                info.revert(); 
            }
        });
    };

    const handleEventClick = (info) => {
        const clickedAppointment = appointments.find(app => app.id == info.event.id);
        if (clickedAppointment) {
            setSelectedAppointment(clickedAppointment);
            setIsDetailsModalOpen(true);
        }
    };

    // 🛠️ CORREÇÃO 2: Esconde a modal de trás quando for cancelar
    const promptCancelAppointment = () => {
        setCancelReason(''); 
        setIsDetailsModalOpen(false); // Fica mais limpo visualmente
        setIsConfirmCancelOpen(true);
    };

    // 🛠️ CORREÇÃO 3: Trava de segurança e limpeza no momento certo
    const executeCancel = () => {
        if (!selectedAppointment) return; // Evita o erro de variável null

        router.delete(route('appointments.destroy', selectedAppointment.id), {
            data: { reason: cancelReason }, 
            onSuccess: () => {
                setIsConfirmCancelOpen(false);
                setSelectedAppointment(null); // Só limpa DEPOIS que apagou com sucesso
            }
        });
    };

    const calendarEvents = appointments.map((appointment) => ({
        id: appointment.id,
        title: `${appointment.client_name} - ${appointment.service?.name || 'Serviço Removido'}`,
        start: appointment.start_time,
        end: appointment.end_time,
        backgroundColor: '#4f46e5',
        borderColor: '#4338ca',
    }));

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Gestão de Agendamentos</h2>}>
            <Head title="Agenda" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            {flash.success}
                        </div>
                    )}

                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek" 
                            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                            events={calendarEvents} 
                            locale="pt-br"
                            buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
                            slotMinTime="08:00:00" slotMaxTime="20:00:00" allDaySlot={false} height="auto"
                            
                            dateClick={handleDateClick} 
                            editable={true} 
                            eventDrop={handleEventDrop} 
                            selectable={true} 
                            selectMirror={true}
                            eventClick={handleEventClick} 
                        />
                    </div>
                </div>
            </div>

            {/* MODAL 1: NOVO AGENDAMENTO */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Novo Agendamento</h2>
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="service_id" value="Serviço" />
                            <select id="service_id" className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm" value={data.service_id} onChange={(e) => setData('service_id', e.target.value)} required>
                                <option value="" disabled>Selecione um serviço...</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>{service.name} ({service.duration_minutes} min)</option>
                                ))}
                            </select>
                            <InputError className="mt-2" message={errors.service_id} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="client_name" value="Nome do Cliente" />
                                <TextInput id="client_name" className="mt-1 block w-full" value={data.client_name} onChange={(e) => setData('client_name', e.target.value)} required />
                                <InputError className="mt-2" message={errors.client_name} />
                            </div>
                            <div>
                                <InputLabel htmlFor="client_phone" value="Telefone / WhatsApp" />
                                <TextInput id="client_phone" className="mt-1 block w-full" value={data.client_phone} onChange={(e) => setData('client_phone', e.target.value)} />
                                <InputError className="mt-2" message={errors.client_phone} />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="start_time" value="Data e Hora de Início" />
                            <TextInput id="start_time" type="datetime-local" className="mt-1 block w-full" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} required />
                            <InputError className="mt-2" message={errors.start_time} />
                        </div>

                        <div className="flex items-center justify-end gap-4 mt-6">
                            <SecondaryButton onClick={closeModal}>Cancelar</SecondaryButton>
                            <PrimaryButton disabled={processing}>Confirmar Horário</PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* MODAL 2: DETALHES DO AGENDAMENTO */}
            <Modal show={isDetailsModalOpen} onClose={closeDetailsModal}>
                {selectedAppointment && (
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Detalhes do Agendamento</h2>
                            <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3 mb-6">
                            <div>
                                <p className="text-xs text-gray-500 font-semibold uppercase">Cliente</p>
                                <p className="text-base text-gray-900 font-medium">{selectedAppointment.client_name}</p>
                                {selectedAppointment.client_phone && (
                                    <p className="text-sm text-indigo-600">{selectedAppointment.client_phone}</p>
                                )}
                            </div>
                            
                            <div className="border-t border-gray-200 pt-3">
                                <p className="text-xs text-gray-500 font-semibold uppercase">Serviço</p>
                                <p className="text-base text-gray-900">{selectedAppointment.service?.name || 'Serviço Removido'}</p>
                            </div>

                            <div className="border-t border-gray-200 pt-3 grid grid-cols-2">
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Início</p>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {new Date(selectedAppointment.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Fim</p>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {new Date(selectedAppointment.end_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <button 
                                onClick={promptCancelAppointment} 
                                className="text-red-600 hover:text-red-800 text-sm font-semibold transition"
                            >
                                Cancelar Agendamento
                            </button>
                            <SecondaryButton onClick={closeDetailsModal}>Fechar</SecondaryButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL 3: CONFIRMAÇÃO ELEGANTE DE CANCELAMENTO COM JUSTIFICATIVA */}
            <Modal show={isConfirmCancelOpen} onClose={() => setIsConfirmCancelOpen(false)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar Agendamento?</h3>
                    
                    <p className="text-sm text-gray-500 mb-4">
                        Tem certeza que deseja cancelar o horário de <strong className="text-gray-700">{selectedAppointment?.client_name}</strong>?
                    </p>

                    <div className="text-left mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo do Cancelamento (Opcional)</label>
                        <textarea
                            className="w-full border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md shadow-sm text-sm"
                            rows="3"
                            placeholder="Ex: A profissional precisou sair por uma emergência."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">Este motivo será enviado ao cliente no WhatsApp.</p>
                    </div>

                    <div className="flex justify-center gap-3">
                        <button onClick={() => setIsConfirmCancelOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition w-full">
                            Voltar
                        </button>
                        <button 
                            onClick={executeCancel} 
                            className="px-4 py-2 text-sm font-medium text-white rounded-md transition w-full bg-red-600 hover:bg-red-700"
                        >
                            Sim, Cancelar
                        </button>
                    </div>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}