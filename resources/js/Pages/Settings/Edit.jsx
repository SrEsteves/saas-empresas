import { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Edit({ tenant, defaultMessage, defaultConfirmation, defaultCancellation, isNewSetup }) {
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

    // Funções de formatação
    const formatPhone = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (!cleaned) return '';
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    };

    const formatUrl = (value) => {
        return value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhone(e.target.value);
        setData('phone', formatted);
    };

    const handleUrlChange = (e) => {
        const formatted = formatUrl(e.target.value);
        setData('public_url_slug', formatted);
    };

    const { data, setData, put, processing, errors } = useForm({
        working_hours: tenant.working_hours || defaultHours,
        closed_dates: tenant.closed_dates || [],
        bot_message: tenant.bot_message || defaultMessage,
        confirmation_message: tenant.confirmation_message || defaultConfirmation,
        cancellation_message: tenant.cancellation_message || defaultCancellation,
        appointment_interval_minutes: tenant.appointment_interval_minutes || 30,
        logo_path: tenant.logo_path || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        public_url_slug: tenant.public_url_slug || '',
    });

    const [newClosedDate, useStateClosedDate] = useState('');
    const [showTutorial, setShowTutorial] = useState(isNewSetup);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    // Referências para cada seção do tutorial
    const companyInfoRef = useRef(null);
    const hoursRef = useRef(null);
    const closedDatesRef = useRef(null);
    const botMessageRef = useRef(null);
    const notificationRef = useRef(null);

    // Dados do tutorial
    const tutorialSteps = [
        {
            id: 'welcome',
            title: '👋 Bem-vindo ao AgendaPro!',
            description: 'Vamos configurar sua empresa em 5 minutos. Clique em Próximo para começar.',
            target: null,
        },
        {
            id: 'company',
            title: '🏢 Informações da Empresa',
            description: 'Como seus clientes vão encontrar você? Configure seu endereço, telefone e a URL pública da sua agenda (por exemplo: agendapro.com/minha-empresa).',
            target: companyInfoRef,
        },
        {
            id: 'hours',
            title: '⏰ Horários de Funcionamento',
            description: 'Defina os horários que você atende em cada dia da semana. Os clientes só poderão agendar dentro desses horários.',
            target: hoursRef,
        },
        {
            id: 'closed',
            title: '🗓️ Feriados e Folgas',
            description: 'Marque os dias que você está fechado. Os clientes não conseguirão agendar nesses dias.',
            target: closedDatesRef,
        },
        {
            id: 'bot',
            title: '🤖 Mensagem Inicial',
            description: 'Esta é a mensagem que seu bot WhatsApp enviará quando um cliente disser "Oi". Use {link} para incluir o link da sua agenda e {nome_empresa} para o nome do seu negócio.',
            target: botMessageRef,
        },
        {
            id: 'notifications',
            title: '📱 Mensagens de Notificação',
            description: 'Personalize os textos que o cliente recebe quando você aprova ou nega um agendamento. Use {nome_cliente}, {data_hora} e {nome_empresa}.',
            target: notificationRef,
        },
        {
            id: 'finish',
            title: '✅ Pronto para começar!',
            description: 'Clique em "Ativar Sistema" para salvar suas configurações e começar a receber agendamentos.',
            target: null,
        },
    ];

    // Scroll automático para a seção do tutorial
    useEffect(() => {
        const step = tutorialSteps[tutorialStep];
        if (step.target && step.target.current && !scrolled) {
            setTimeout(() => {
                step.target.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setScrolled(true);
            }, 300);
        } else {
            setScrolled(false);
        }
    }, [tutorialStep, scrolled]);

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

    const nextStep = () => {
        if (tutorialStep < tutorialSteps.length - 1) {
            setTutorialStep(tutorialStep + 1);
            setScrolled(false);
        } else {
            setShowTutorial(false);
        }
    };

    const skipTutorial = () => {
        setShowTutorial(false);
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Configurações do Estabelecimento</h2>}>
            <Head title="Configurações" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {isNewSetup && (
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium">Bem-vindo ao AgendaPro! 🎉</h3>
                                        <p className="mt-1 text-indigo-100">
                                            Configure sua empresa para começar a receber agendamentos. Preencha as informações abaixo para ativar seu sistema.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTutorial(true);
                                        setTutorialStep(0);
                                    }}
                                    className="ml-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md transition text-sm font-semibold whitespace-nowrap"
                                >
                                    📖 Tutorial
                                </button>
                            </div>
                        </div>
                    )}

                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        
                        {/* TUTORIAL POPOVER */}
                        {showTutorial && (
                            <div className="fixed bottom-8 right-8 z-50 max-w-md">
                                <div className="bg-white rounded-lg shadow-2xl p-6 border-2 border-indigo-500">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-900">{tutorialSteps[tutorialStep].title}</h3>
                                        <button
                                            onClick={skipTutorial}
                                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                        {tutorialSteps[tutorialStep].description}
                                    </p>
                                    
                                    {/* Setinha apontando para a seção */}
                                    {tutorialSteps[tutorialStep].target && (
                                        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 text-indigo-500 text-3xl">
                                            ▶
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                        <span className="text-xs text-gray-500">
                                            Passo {tutorialStep + 1} de {tutorialSteps.length}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={skipTutorial}
                                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition"
                                            >
                                                Pular
                                            </button>
                                            <button
                                                onClick={nextStep}
                                                className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-semibold"
                                            >
                                                {tutorialStep === tutorialSteps.length - 1 ? 'Concluído!' : 'Próximo →'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* 1. INFORMAÇÕES BÁSICAS DA EMPRESA */}
                        <div 
                            className="bg-white shadow sm:rounded-lg p-6" 
                            ref={companyInfoRef}
                            style={
                                showTutorial && tutorialSteps[tutorialStep].id === 'company' 
                                    ? { border: '2px solid rgb(99, 102, 241)', transition: 'all 0.3s ease' }
                                    : { border: '1px solid transparent' }
                            }
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">1. Informações da Empresa</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                                    <input 
                                        type="text" 
                                        value={tenant.name} 
                                        disabled 
                                        className="w-full border-gray-300 bg-gray-50 rounded-md shadow-sm text-sm cursor-not-allowed" 
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Para alterar o nome, entre em contato conosco</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Pública da Agenda</label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                                            agendapro.com/
                                        </span>
                                        <input 
                                            type="text" 
                                            value={data.public_url_slug} 
                                            onChange={handleUrlChange}
                                            placeholder="minha-empresa"
                                            className="flex-1 min-w-0 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-r-md shadow-sm text-sm" 
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Apenas letras minúsculas, números e hífens</p>
                                    {errors.public_url_slug && <p className="mt-1 text-sm text-red-600">{errors.public_url_slug}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                    <input 
                                        type="text" 
                                        value={data.address} 
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Rua das Flores, 123 - Centro, Cidade - UF"
                                        className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm" 
                                    />
                                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input 
                                        type="tel" 
                                        value={data.phone} 
                                        onChange={handlePhoneChange}
                                        placeholder="(11) 99999-9999"
                                        maxLength="15"
                                        className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm" 
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Formato: (XX) XXXXX-XXXX</p>
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo entre Atendimentos (minutos)</label>
                                    <select 
                                        value={data.appointment_interval_minutes} 
                                        onChange={(e) => setData('appointment_interval_minutes', parseInt(e.target.value))}
                                        className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                    >
                                        <option value={15}>15 minutos</option>
                                        <option value={30}>30 minutos</option>
                                        <option value={45}>45 minutos</option>
                                        <option value={60}>1 hora</option>
                                        <option value={90}>1 hora e 30 minutos</option>
                                        <option value={120}>2 horas</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Tempo mínimo entre agendamentos consecutivos</p>
                                    {errors.appointment_interval_minutes && <p className="mt-1 text-sm text-red-600">{errors.appointment_interval_minutes}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo da Empresa</label>
                                    <input 
                                        type="url" 
                                        value={data.logo_path} 
                                        onChange={(e) => setData('logo_path', e.target.value)}
                                        placeholder="https://exemplo.com/logo.png"
                                        className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm" 
                                    />
                                    <p className="text-xs text-gray-500 mt-1">URL de uma imagem (PNG, JPG, etc.)</p>
                                    {errors.logo_path && <p className="mt-1 text-sm text-red-600">{errors.logo_path}</p>}
                                </div>
                            </div>
                        </div>
                        
                        {/* 2. HORÁRIOS */}
                        <div 
                            className="bg-white shadow sm:rounded-lg p-6" 
                            ref={hoursRef}
                            style={
                                showTutorial && tutorialSteps[tutorialStep].id === 'hours' 
                                    ? { border: '2px solid rgb(99, 102, 241)', transition: 'all 0.3s ease' }
                                    : { border: '1px solid transparent' }
                            }
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">2. Horários de Funcionamento</h3>
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

                        {/* 3. FOLGAS */}
                        <div 
                            className="bg-white shadow sm:rounded-lg p-6" 
                            ref={closedDatesRef}
                            style={
                                showTutorial && tutorialSteps[tutorialStep].id === 'closed' 
                                    ? { border: '2px solid rgb(99, 102, 241)', transition: 'all 0.3s ease' }
                                    : { border: '1px solid transparent' }
                            }
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">3. Feriados e Dias de Folga</h3>
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

                        {/* 4. MENSAGEM DO BOT (SAUDAÇÃO) */}
                        <div 
                            className="bg-white shadow sm:rounded-lg p-6" 
                            ref={botMessageRef}
                            style={
                                showTutorial && tutorialSteps[tutorialStep].id === 'bot' 
                                    ? { border: '2px solid rgb(99, 102, 241)', transition: 'all 0.3s ease' }
                                    : { border: '1px solid transparent' }
                            }
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">4. Mensagem Inicial (Saudação)</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                O que o bot responde quando o cliente manda "Oi". <br/>
                                Variáveis permitidas: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'{link}'}</code> (Obrigatório) e <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{'{nome_empresa}'}</code>.
                            </p>
                            <textarea value={data.bot_message} onChange={(e) => setData('bot_message', e.target.value)} rows={4} className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"></textarea>
                            {errors.bot_message && <p className="mt-2 text-sm text-red-600">{errors.bot_message}</p>}
                        </div>

                        {/* 5. MENSAGENS DE NOTIFICAÇÃO (CONFIRMAÇÃO E CANCELAMENTO) */}
                        <div 
                            className="bg-white shadow sm:rounded-lg p-6" 
                            ref={notificationRef}
                            style={
                                showTutorial && tutorialSteps[tutorialStep].id === 'notifications' 
                                    ? { border: '2px solid rgb(99, 102, 241)', transition: 'all 0.3s ease' }
                                    : { border: '1px solid transparent' }
                            }
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-4">5. Mensagens de Notificação</h3>
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
                                {processing ? 'Salvando...' : (isNewSetup ? 'Ativar Sistema' : 'Salvar Configurações')}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}