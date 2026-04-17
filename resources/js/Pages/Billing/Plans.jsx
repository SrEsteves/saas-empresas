import { useState } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Plans({ plans, currentPlan, currentSubscription }) {
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [loadingPlanId, setLoadingPlanId] = useState(null);
    const [error, setError] = useState(null);

    // ✅ axios direto — o useForm/post do Inertia não permite capturar JSON de volta
    const handleCheckout = async (plan) => {
        if (plan.slug === 'enterprise') {
            window.location.href = 'mailto:contato@agendapro.com.br';
            return;
        }
        if (plan.monthly_price === 0) {
            window.location.href = route('billing.dashboard');
            return;
        }

        setLoadingPlanId(plan.id);
        setError(null);

        try {
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;

            const { data } = await axios.post(
                route('billing.checkout'),
                { plan_id: plan.id, billing_period: billingPeriod },
                { headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' } }
            );

            if (data?.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                setError('URL de checkout não recebida. Tente novamente.');
            }
        } catch (err) {
            const msg =
                err.response?.data?.error ??
                err.response?.data?.message ??
                'Erro ao iniciar checkout.';
            setError(msg);
            console.error('[Checkout Error]', err.response?.data);
        } finally {
            setLoadingPlanId(null);
        }
    };

    const getPricePerMonth = (plan) => {
        if (!plan.monthly_price) return null;
        if (billingPeriod === 'yearly' && plan.yearly_price)
            return (plan.yearly_price / 100 / 12).toFixed(2);
        return (plan.monthly_price / 100).toFixed(2);
    };

    const getSavings = (plan) => {
        if (!plan.yearly_price || !plan.monthly_price) return 0;
        return Math.round(((plan.monthly_price * 12 - plan.yearly_price) / (plan.monthly_price * 12)) * 100);
    };

    const featureLabels = {
        basic_scheduling:           'Agendamentos online',
        whatsapp_integration:       'Integração WhatsApp',
        employee_management:        'Gestão de colaboradores',
        custom_messages:            'Mensagens personalizadas',
        email_notifications:        'Notificações por e-mail',
        stock_management:           'Controle de estoque',
        reports_and_analytics:      'Relatórios e analytics',
        api_access:                 'Acesso à API',
        sso_integration:            'SSO / Login único',
        custom_integration:         'Integrações customizadas',
        priority_support:           'Suporte prioritário',
        dedicated_account_manager:  'Gerente de conta dedicado',
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-black text-lg text-gray-900 leading-tight tracking-tight">Planos</h2>
                    <p className="text-xs text-gray-400">Escolha o plano ideal para o seu negócio.</p>
                </div>
            }
        >
            <Head title="Planos" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">

                {/* ERRO */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-700">{error}</p>
                            <p className="text-xs text-red-400 mt-0.5">Verifique STRIPE_SECRET_KEY e os PRICE IDs no .env</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-300 hover:text-red-600 text-xl leading-none">&times;</button>
                    </div>
                )}

                {/* TOGGLE */}
                <div className="flex items-center justify-center gap-4">
                    <span className={`text-sm font-semibold ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Mensal</span>
                    <button
                        onClick={() => setBillingPeriod(p => p === 'monthly' ? 'yearly' : 'monthly')}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${billingPeriod === 'yearly' ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-sm font-semibold ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>Anual</span>
                    {billingPeriod === 'yearly' && (
                        <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-100">
                            Economize até 2 meses
                        </span>
                    )}
                </div>

                {/* CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
                    {plans.map((plan) => {
                        const isCurrent   = currentPlan?.id === plan.id;
                        const isFree      = plan.monthly_price === 0 && plan.slug !== 'enterprise';
                        const isEnterprise = plan.slug === 'enterprise';
                        const isPopular   = plan.slug === 'professional';
                        const isLoading   = loadingPlanId === plan.id;
                        const price       = getPricePerMonth(plan);
                        const savings     = getSavings(plan);

                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                                    isCurrent ? 'border-indigo-400 ring-2 ring-indigo-400 ring-offset-1' :
                                    isPopular  ? 'border-violet-200 ring-2 ring-violet-400 ring-offset-1' :
                                    'border-gray-100'
                                }`}
                            >
                                {isCurrent && (
                                    <div className="bg-indigo-600 text-white text-[10px] font-bold text-center py-1.5 tracking-wide">
                                        SEU PLANO ATUAL
                                    </div>
                                )}
                                {isPopular && !isCurrent && (
                                    <div className="bg-violet-600 text-white text-[10px] font-bold text-center py-1.5 tracking-wide">
                                        MAIS POPULAR
                                    </div>
                                )}

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Nome */}
                                    <h3 className="text-base font-black text-gray-900 mb-1">{plan.name}</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed mb-5">{plan.description}</p>

                                    {/* Preço */}
                                    <div className="mb-6 min-h-[56px]">
                                        {isEnterprise ? (
                                            <p className="text-2xl font-black text-gray-900">Sob demanda</p>
                                        ) : isFree ? (
                                            <div>
                                                <p className="text-3xl font-black text-gray-900">Grátis</p>
                                                <p className="text-xs text-gray-400 mt-1">{plan.trial_days} dias de trial incluídos</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-xs text-gray-400 self-start mt-1">R$</span>
                                                    <span className="text-3xl font-black text-gray-900">{price}</span>
                                                    <span className="text-xs text-gray-400 self-end mb-0.5">/mês</span>
                                                </div>
                                                {billingPeriod === 'yearly' && savings > 0 && (
                                                    <p className="text-xs text-green-600 font-semibold mt-1">-{savings}% vs mensal</p>
                                                )}
                                                {billingPeriod === 'monthly' && (
                                                    <p className="text-xs text-gray-400 mt-1">cobrado mensalmente</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <div className="flex-1 space-y-2 mb-6">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Incluso</p>

                                        {/* Limites numéricos */}
                                        {[
                                            plan.max_appointments_per_month
                                                ? `${plan.max_appointments_per_month.toLocaleString('pt-BR')} agendamentos/mês`
                                                : 'Agendamentos ilimitados',
                                            plan.max_employees
                                                ? `${plan.max_employees} colaborador${plan.max_employees > 1 ? 'es' : ''}`
                                                : 'Colaboradores ilimitados',
                                            plan.max_services
                                                ? `${plan.max_services} serviços`
                                                : 'Serviços ilimitados',
                                        ].map((item) => (
                                            <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                                                <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                                {item}
                                            </div>
                                        ))}

                                        {/* Features do plano */}
                                        {(plan.features ?? []).map((f) => (
                                            featureLabels[f] ? (
                                                <div key={f} className="flex items-start gap-2 text-xs text-gray-600">
                                                    <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {featureLabels[f]}
                                                </div>
                                            ) : null
                                        ))}
                                    </div>

                                    {/* Botão */}
                                    <button
                                        onClick={() => handleCheckout(plan)}
                                        disabled={isCurrent || isLoading}
                                        className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                            isCurrent
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : isEnterprise
                                                ? 'bg-gray-900 hover:bg-gray-700 text-white'
                                                : isFree
                                                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                                                : isPopular
                                                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-100'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100'
                                        }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Redirecionando...
                                            </>
                                        ) : isCurrent ? (
                                            '✓ Plano atual'
                                        ) : isEnterprise ? (
                                            'Falar com vendas'
                                        ) : isFree ? (
                                            'Começar grátis'
                                        ) : (
                                            'Assinar agora'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA ENTERPRISE */}
                <div className="bg-gray-900 rounded-2xl p-8 text-white text-center">
                    <h2 className="text-xl font-black mb-2">Precisa de algo customizado?</h2>
                    <p className="text-gray-400 text-sm mb-6">Entre em contato para um plano enterprise com integrações e suporte dedicado.</p>
                    <a
                        href="mailto:contato@agendapro.com.br"
                        className="inline-block bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-xl hover:bg-gray-100 transition"
                    >
                        Falar com nosso time
                    </a>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}