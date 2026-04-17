import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ currentSubscription, currentPlan, invoices, usage, daysLeftOnTrial, isOnTrial }) {
    const { post, processing } = useForm();
    const [showCancelModal, setShowCancelModal] = useState(false);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    const formatPrice = (p) => p ? `R$ ${(p / 100).toFixed(2).replace('.', ',')}` : '—';

    const statusConfig = {
        active:   { label: 'Ativa',      class: 'bg-green-50 text-green-700 border-green-100' },
        trial:    { label: 'Trial',       class: 'bg-blue-50 text-blue-700 border-blue-100' },
        trialing: { label: 'Trial',       class: 'bg-blue-50 text-blue-700 border-blue-100' },
        canceled: { label: 'Cancelada',   class: 'bg-red-50 text-red-700 border-red-100' },
        past_due: { label: 'Em atraso',   class: 'bg-amber-50 text-amber-700 border-amber-100' },
        expired:  { label: 'Expirada',    class: 'bg-gray-50 text-gray-600 border-gray-100' },
    };

    const status = currentSubscription?.status ?? 'none';
    const statusInfo = statusConfig[status] ?? { label: 'Sem plano', class: 'bg-gray-50 text-gray-500 border-gray-100' };

    const getUsagePct = (used, limit) => {
        if (!limit) return 0;
        return Math.min(Math.round((used / limit) * 100), 100);
    };

    const usageItems = [
        {
            label: 'Agendamentos',
            used: usage?.appointments_used ?? 0,
            limit: currentPlan?.max_appointments_per_month ?? null,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            label: 'Colaboradores',
            used: usage?.employees_used ?? 0,
            limit: currentPlan?.max_employees ?? null,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
        {
            label: 'Serviços',
            used: usage?.services_used ?? 0,
            limit: currentPlan?.max_services ?? null,
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-black text-lg text-gray-900 leading-tight tracking-tight">Faturamento</h2>
                    <p className="text-xs text-gray-400">Gerencie sua assinatura e histórico de faturas.</p>
                </div>
            }
        >
            <Head title="Faturamento" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">

                {/* BANNER TRIAL */}
                {isOnTrial && daysLeftOnTrial > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-blue-800">
                                Você está no período de trial — {daysLeftOnTrial} dia{daysLeftOnTrial !== 1 ? 's' : ''} restante{daysLeftOnTrial !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-blue-600 mt-0.5">Assine um plano para continuar usando após o trial.</p>
                        </div>
                        <Link href={route('billing.plans')} className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition flex-shrink-0">
                            Ver planos
                        </Link>
                    </div>
                )}

                {/* STATUS DA ASSINATURA */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800">Status da Assinatura</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.class}`}>
                            {statusInfo.label}
                        </span>
                    </div>

                    <div className="p-6 grid sm:grid-cols-2 gap-6">
                        {/* Plano atual */}
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Plano atual</p>
                            {currentPlan ? (
                                <>
                                    <p className="text-2xl font-black text-indigo-600">{currentPlan.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">{currentPlan.description}</p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400">Nenhum plano ativo</p>
                            )}
                        </div>

                        {/* Próxima cobrança */}
                        <div>
                            <p className="text-xs text-gray-400 mb-1">
                                {isOnTrial ? 'Trial expira em' : 'Próxima cobrança'}
                            </p>
                            {isOnTrial ? (
                                <p className="text-lg font-bold text-gray-900">
                                    {formatDate(currentSubscription?.trial_ends_at)}
                                </p>
                            ) : currentSubscription?.current_period_end ? (
                                <p className="text-lg font-bold text-gray-900">
                                    {formatDate(currentSubscription.current_period_end)}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400">—</p>
                            )}
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="px-6 pb-6 flex flex-wrap gap-3">
                        {status === 'active' && (
                            <>
                                <Link
                                    href={route('billing.plans')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
                                >
                                    Fazer upgrade
                                </Link>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold px-5 py-2.5 rounded-xl transition"
                                >
                                    Cancelar assinatura
                                </button>
                            </>
                        )}
                        {(status === 'canceled' || status === 'expired') && (
                            <Link
                                href={route('billing.plans')}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
                            >
                                Reativar assinatura
                            </Link>
                        )}
                        {(!currentSubscription || status === 'none') && (
                            <Link
                                href={route('billing.plans')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
                            >
                                Escolher plano
                            </Link>
                        )}
                    </div>
                </div>

                {/* USO DO PLANO */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800">Uso do Plano — Mês Atual</h3>
                    </div>
                    <div className="p-6 grid sm:grid-cols-3 gap-6">
                        {usageItems.map((item) => {
                            const pct = getUsagePct(item.used, item.limit);
                            const isUnlimited = !item.limit;
                            const isWarning = !isUnlimited && pct >= 80;

                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <span className="text-gray-400">{item.icon}</span>
                                            {item.label}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {item.used} / {isUnlimited ? '∞' : item.limit}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        {isUnlimited ? (
                                            <div className="bg-indigo-200 h-1.5 w-full rounded-full" />
                                        ) : (
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${isWarning ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        )}
                                    </div>
                                    {isWarning && (
                                        <p className="text-[10px] text-amber-600 mt-1 font-medium">
                                            {pct === 100 ? 'Limite atingido' : `${pct}% utilizado`}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* HISTÓRICO DE FATURAS */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800">Histórico de Faturas</h3>
                    </div>

                    {invoices?.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">PDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="px-6 py-3.5 text-gray-600">{formatDate(invoice.created_at)}</td>
                                        <td className="px-6 py-3.5 text-gray-700 font-medium">{invoice.description}</td>
                                        <td className="px-6 py-3.5 text-right font-bold text-gray-900">{formatPrice(invoice.amount)}</td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                invoice.status === 'paid'    ? 'bg-green-50 text-green-700 border-green-100' :
                                                invoice.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                                {invoice.status === 'paid' ? 'Pago' : invoice.status === 'pending' ? 'Pendente' : 'Falhou'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            {invoice.pdf_url && (
                                                <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold">
                                                    Baixar
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-12 text-center text-sm text-gray-400">
                            Nenhuma fatura encontrada.
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL CANCELAMENTO */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-black text-gray-900 text-center mb-2">Cancelar assinatura?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Você perderá acesso aos recursos premium ao final do período atual. Esta ação pode ser revertida.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl transition"
                            >
                                Manter assinatura
                            </button>
                            <button
                                onClick={() => post(route('billing.cancel'), { onSuccess: () => setShowCancelModal(false) })}
                                disabled={processing}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-50"
                            >
                                {processing ? 'Cancelando...' : 'Cancelar mesmo assim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}