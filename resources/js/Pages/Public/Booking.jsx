import { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';

export default function Booking({ tenant, services }) {
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Estados para controlar a interface inteligente
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');

    // 🌟 NOVOS ESTADOS PARA OS PROFISSIONAIS
    const [employees, setEmployees] = useState([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        service_id: '',
        employee_id: '', // 🌟 AGORA ENVIAMOS O PROFISSIONAL PRO BANCO
        client_name: '',
        client_phone: '',
        start_time: '',
    });

    // 🌟 EFEITO 1: Quando escolhe um serviço, busca os profissionais que fazem ele
    useEffect(() => {
        if (data.service_id) {
            setIsLoadingEmployees(true);
            setData('employee_id', ''); // Reseta o profissional se trocar de serviço
            setSelectedDate(''); // Reseta a data
            setAvailableSlots([]); // Limpa os horários antigos
            
            axios.get(route('public.employees', tenant.id), { // <-- AQUI
                params: { service_id: data.service_id }
            }).then(response => {
                setEmployees(response.data);
                setIsLoadingEmployees(false);
            }).catch(() => setIsLoadingEmployees(false));
        }
    }, [data.service_id, tenant.id]); // <-- E AQUI NA DEPENDÊNCIA

    // 🌟 EFEITO 2: Quando tem Serviço, Profissional e Data, busca os horários livres
    useEffect(() => {
        if (data.service_id && data.employee_id && selectedDate) {
            setIsLoadingSlots(true);
            setSelectedTime(''); // Limpa a hora escolhida antes se mudar de dia
            
            axios.get(route('public.slots', tenant.id), { // <-- AQUI
                params: { 
                    date: selectedDate, 
                    service_id: data.service_id,
                    employee_id: data.employee_id 
                }
            }).then(response => {
                setAvailableSlots(response.data);
                setIsLoadingSlots(false);
            }).catch(() => setIsLoadingSlots(false));
        }
    }, [selectedDate, data.service_id, data.employee_id, tenant.id]); // <-- E AQUI NA DEPENDÊNCIA

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setData('start_time', `${selectedDate} ${time}:00`);
    };

   const submit = (e) => {
        e.preventDefault();
        post(route('public.store', tenant.id), { // <-- AQUI
            onSuccess: () => {
                reset();
                setSelectedDate('');
                setSelectedTime('');
                setEmployees([]);
                setIsSuccess(true);
            },
        });
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-6 sm:pt-12 pb-12">
            <Head title={`Agendar - ${tenant.name}`} />

            <div className="w-full sm:max-w-md mt-6 px-6 py-8 bg-white shadow-md overflow-hidden sm:rounded-lg">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
                    <p className="text-sm text-gray-500 mt-2">Agende seu horário de forma rápida e fácil.</p>
                </div>

                {isSuccess ? (
                    <div className="text-center py-8">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Pedido Enviado!</h3>
                        <p className="mt-2 text-sm text-gray-500">Seu pedido foi enviado com sucesso. Aguarde a confirmação no seu WhatsApp.</p>
                        <button onClick={() => setIsSuccess(false)} className="mt-6 text-indigo-600 font-semibold hover:text-indigo-500 text-sm">
                            Fazer outro agendamento
                        </button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-5">
                        {/* 1. Escolha do Serviço */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">1. O que você deseja fazer?</label>
                            <select
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.service_id}
                                onChange={(e) => setData('service_id', e.target.value)}
                                required
                            >
                                <option value="" disabled>Selecione um serviço...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price} ({s.duration_minutes} min)</option>
                                ))}
                            </select>
                            {errors.service_id && <p className="mt-1 text-sm text-red-600">{errors.service_id}</p>}
                        </div>

                        {/* 🌟 2. Escolha do Profissional (Só aparece depois do serviço) */}
                        {data.service_id && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">2. Com quem?</label>
                                {isLoadingEmployees ? (
                                    <p className="text-sm text-gray-500 mt-2">Buscando profissionais...</p>
                                ) : employees.length > 0 ? (
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.employee_id}
                                        onChange={(e) => setData('employee_id', e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Escolha um profissional...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded">
                                        Nenhum profissional disponível para este serviço no momento.
                                    </p>
                                )}
                                {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>}
                            </div>
                        )}

                        {/* 3. Escolha do Dia (Só aparece depois do profissional) */}
                        {data.employee_id && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">3. Escolha o Dia</label>
                                <input
                                    type="date"
                                    min={today}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {/* 4. Escolha do Horário */}
                        {selectedDate && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">4. Horários Disponíveis</label>
                                
                                {isLoadingSlots ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Buscando horários...</p>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableSlots.map((time) => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => handleTimeSelect(time)}
                                                className={`py-2 px-1 text-sm rounded-md border font-medium transition-colors ${
                                                    selectedTime === time 
                                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500 hover:text-indigo-600'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-red-500 text-center py-4 border rounded bg-red-50">
                                        O profissional não tem horários livres neste dia. Escolha outra data.
                                    </p>
                                )}
                                {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
                            </div>
                        )}

                        {/* 5. Dados do Cliente */}
                        {selectedTime && (
                            <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                                <label className="block text-sm font-medium text-gray-700">5. Seus Dados</label>
                                
                                <input
                                    type="text"
                                    placeholder="Seu Nome Completo"
                                    className="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.client_name}
                                    onChange={(e) => setData('client_name', e.target.value)}
                                    required
                                />
                                {errors.client_name && <p className="text-sm text-red-600">{errors.client_name}</p>}

                                <input
                                    type="tel"
                                    placeholder="Seu WhatsApp (Ex: 11999999999)"
                                    className="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={data.client_phone}
                                    onChange={(e) => setData('client_phone', e.target.value)}
                                    required
                                />
                                {errors.client_phone && <p className="text-sm text-red-600">{errors.client_phone}</p>}
                                
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex justify-center py-3 px-4 mt-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {processing ? 'Enviando...' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}