import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Edit({ tenant, defaultMessage, defaultConfirmation, defaultCancellation }) {
    const { props } = usePage();
    const flash = props.flash || {};

    const defaultHours = {
        monday: { isOpen: true, start: '08:00', end: '18:00' },
        tuesday: { isOpen: true, start: '08:00', end: '18:00' },
        wednesday: { isOpen: true, start: '08:00', end: '18:00' },
        thursday: { isOpen: true, start: '08:00', end: '18:00' },
        friday: { isOpen: true, start: '08:00', end: '18:00' },
        saturday: { isOpen: true, start: '08:00', end: '12:00' },
        sunday: { isOpen: false, start: '08:00', end: '12:00' },
    };

    const daysTranslation = {
        monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo'
    };

    const { data, setData, put, processing, errors } = useForm({
        working_hours: tenant.working_hours || defaultHours,
        closed_dates: tenant.closed_dates || [],
        bot_message: tenant.bot_message || defaultMessage,
        confirmation_message: tenant.confirmation_message || defaultConfirmation,
        cancellation_message: tenant.cancellation_message || defaultCancellation,
    });

    const [newClosedDate, useStateClosedDate] = useState('');

    const submit = (e) => {
        e.preventDefault();
        put(route('settings.update'));
    };

    const handleDayChange = (day, field, value) => {
        setData('working_hours', {
            ...data.working_hours,
            [day]: { ...data.working_hours[day], [field]: value }
        });
    };

    const addClosedDate = () => {
        if (newClosedDate && !data.closed_dates.includes(newClosedDate)) {
            setData('closed_dates', [...data.closed_dates, newClosedDate].sort());
            useStateClosedDate('');
        }
    };

    const removeClosedDate = (dateToRemove) => {
        setData('closed_dates', data.closed_dates.filter(date => date !== dateToRemove));
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Configurações do Estabelecimento</h2>}>
            <Head title="Configurações" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        
                        {/* 1. HORÁRIOS */}
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">1. Horários de Funcionamento</h3>
                            <div className="space-y-3">
                                {Object.keys(defaultHours).map((day) => (
                                    <div key={day} className="flex items-center gap-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                                        <div className="w-40 flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                checked={data.working_hours[day].isOpen}
                                                onChange={(e) => handleDayChange(day, 'isOpen', e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{daysTranslation[day]}</span>
                                        </div>
                                        
                                        {data.working_hours[day].isOpen ? (
                                            <div className="flex items-center gap-2">
                                                <input type="time" value={data.working_hours[day].start} onChange={(e) => handleDayChange(day, 'start', e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm" required />
                                                <span className="text-gray-500">até</span>
                                                <input type="time" value={data.working_hours[day].end} onChange={(e) => handleDayChange(day, 'end', e.target.value)} className="border-gray-300 rounded-md shadow-sm text-sm" required />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-red-500 italic">Fechado</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. FOLGAS */}
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">2. Feriados e Dias de Folga</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <input type="date" value={newClosedDate} onChange={(e) => useStateClosedDate(e.target.value)} className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm" />
                                <button type="button" onClick={addClosedDate} className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm transition">Adicionar Folga</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.closed_dates.length === 0 && <span className="text-sm text-gray-400">Nenhuma data adicionada.</span>}
                                {data.closed_dates.map(date => (
                                    <div key={date} className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-sm">
                                        <span>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                        <button type="button" onClick={() => removeClosedDate(date)} className="text-red-500 hover:text-red-800 font-bold">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. MENSAGEM DO BOT (SAUDAÇÃO) */}
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">3. Mensagem Inicial (Saudação)</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                O que o bot responde quando o cliente manda "Oi". <br/>
                                Variáveis permitidas: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'{link}'}</code> (Obrigatório) e <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'{nome_empresa}'}</code>.
                            </p>
                            <textarea value={data.bot_message} onChange={(e) => setData('bot_message', e.target.value)} rows={4} className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"></textarea>
                            {errors.bot_message && <p className="mt-2 text-sm text-red-600">{errors.bot_message}</p>}
                        </div>

                        {/* 4. MENSAGENS DE NOTIFICAÇÃO (CONFIRMAÇÃO E CANCELAMENTO) */}
                        <div className="bg-white shadow sm:rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">4. Mensagens de Notificação</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Personalize os avisos enviados ao cliente após você avaliar o pedido.<br/>
                                Variáveis permitidas: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'{nome_cliente}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'{data_hora}'}</code> e <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'{nome_empresa}'}</code>.
                            </p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Texto de Confirmação (Agendamento Aceito)</label>
                                    <textarea value={data.confirmation_message} onChange={(e) => setData('confirmation_message', e.target.value)} rows={4} className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"></textarea>
                                    {errors.confirmation_message && <p className="mt-2 text-sm text-red-600">{errors.confirmation_message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Texto de Cancelamento (Agendamento Recusado)</label>
                                    <textarea value={data.cancellation_message} onChange={(e) => setData('cancellation_message', e.target.value)} rows={4} className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"></textarea>
                                    {errors.cancellation_message && <p className="mt-2 text-sm text-red-600">{errors.cancellation_message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={processing} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-semibold transition disabled:opacity-50">
                                {processing ? 'Salvando...' : 'Salvar Configurações'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}