import { useState } from 'react';
import { router } from '@inertiajs/react';
import { createPortal } from 'react-dom';

// ─── Renderizador simples de Markdown (sem dependência extra) ───────────────
function MarkdownRenderer({ content }) {
    const lines = content.split('\n');

    return (
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            {lines.map((line, i) => {
                // Heading ##
                if (line.startsWith('## ')) {
                    return (
                        <h3 key={i} className="text-sm font-black text-gray-900 mt-5 mb-1 first:mt-0">
                            {line.replace('## ', '')}
                        </h3>
                    );
                }
                // Bold **texto**
                if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                        <p key={i} className="font-bold text-gray-900">
                            {line.replace(/\*\*/g, '')}
                        </p>
                    );
                }
                // Bullet point
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    const text = line.replace(/^[-*] /, '');
                    // Inline bold dentro do bullet
                    const parts = text.split(/\*\*(.*?)\*\*/g);
                    return (
                        <div key={i} className="flex gap-2">
                            <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                            <p>
                                {parts.map((part, j) =>
                                    j % 2 === 1
                                        ? <strong key={j} className="font-bold text-gray-900">{part}</strong>
                                        : part
                                )}
                            </p>
                        </div>
                    );
                }
                // Linha numerada 1. 2. 3.
                if (/^\d+\.\s/.test(line)) {
                    const num   = line.match(/^(\d+)\./)[1];
                    const text  = line.replace(/^\d+\.\s/, '');
                    const parts = text.split(/\*\*(.*?)\*\*/g);
                    return (
                        <div key={i} className="flex gap-2">
                            <span className="text-indigo-500 font-bold flex-shrink-0 w-5">{num}.</span>
                            <p>
                                {parts.map((part, j) =>
                                    j % 2 === 1
                                        ? <strong key={j} className="font-bold text-gray-900">{part}</strong>
                                        : part
                                )}
                            </p>
                        </div>
                    );
                }
                // Linha vazia
                if (!line.trim()) return null;
                // Parágrafo normal com inline bold
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                    <p key={i}>
                        {parts.map((part, j) =>
                            j % 2 === 1
                                ? <strong key={j} className="font-bold text-gray-900">{part}</strong>
                                : part
                        )}
                    </p>
                );
            })}
        </div>
    );
}

// ─── Ícone de IA ────────────────────────────────────────────────────────────
function SparkleIcon({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
        </svg>
    );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AiReportModal({ filters }) {
    const [open,    setOpen]    = useState(false);
    const [loading, setLoading] = useState(false);
    const [report,  setReport]  = useState('');
    const [error,   setError]   = useState('');

    const generateReport = async () => {
        setLoading(true);
        setReport('');
        setError('');
        setOpen(true);

        try {
            const res = await fetch(route('dashboard.ai-report'), {
                method: 'POST',
                headers: {
                    'Content-Type':     'application/json',
                    'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'Accept':           'application/json',
                },
                body: JSON.stringify({
                    start_date: filters?.start_date,
                    end_date:   filters?.end_date,
                }),
            });

            if (!res.ok) throw new Error('Erro na requisição');

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Efeito de "digitação" — exibe o texto gradualmente
            const text  = data.report ?? '';
            const words = text.split(' ');
            let   built = '';

            for (let i = 0; i < words.length; i++) {
                built += (i === 0 ? '' : ' ') + words[i];
                setReport(built);
                // Pequeno delay entre palavras para simular streaming
                await new Promise(r => setTimeout(r, 18));
            }
        } catch (e) {
            setError(e.message || 'Não foi possível gerar o relatório.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return; // impede fechar enquanto carrega
        setOpen(false);
        setReport('');
        setError('');
    };

    return (
        <>
            {/* ── Botão de acionar ── */}
            <button
                onClick={generateReport}
                className="
                    inline-flex items-center gap-2
                    bg-indigo-600 hover:bg-indigo-700 active:scale-95
                    text-white text-sm font-bold
                    px-4 py-2 rounded-xl
                    transition-all duration-150
                    shadow-sm shadow-indigo-200
                "
            >
                <SparkleIcon className="w-4 h-4" />
                Relatório IA
            </button>

            {/* ── Modal ── */}
            {open && createPortal(
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header do modal */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <SparkleIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900">Relatório Inteligente</h3>
                                    <p className="text-[10px] text-gray-400">Gerado por IA com base nos seus dados</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-30"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Corpo do modal */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {/* Estado: carregando */}
                            {loading && !report && (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                        <SparkleIcon className="w-6 h-6 text-indigo-500 animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-700">Analisando seus dados...</p>
                                        <p className="text-xs text-gray-400 mt-1">A IA está interpretando os números do período</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                                                style={{ animationDelay: `${i * 0.15}s` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Estado: erro */}
                            {error && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Estado: relatório pronto / sendo digitado */}
                            {report && (
                                <div>
                                    <MarkdownRenderer content={report} />
                                    {/* Cursor piscante enquanto ainda está "digitando" */}
                                    {loading && (
                                        <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between flex-shrink-0">
                            <p className="text-[10px] text-gray-300">Powered by Groq · llama3-8b</p>
                            {!loading && report && (
                                <button
                                    onClick={generateReport}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition"
                                >
                                    <SparkleIcon className="w-3 h-3" />
                                    Gerar novamente
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}