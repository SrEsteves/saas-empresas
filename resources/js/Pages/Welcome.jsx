import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    const barHeights = ['40%', '60%', '50%', '80%', '65%', '90%', '75%'];

    return (
        <div className="min-h-screen bg-white selection:bg-indigo-500 selection:text-white">
            <Head title="AgendaPro - Gestão Inteligente para o seu Negócio" />

            {/* NAVBAR */}
            <nav className="fixed w-full z-50 top-0 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                        Agenda<span className="text-gray-900">Pro</span>
                    </div>
                    <div>
                        {auth.user ? (
                            <Link href={route('dashboard')} className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition">
                                Acessar Painel &rarr;
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href={route('login')} className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition">
                                    Entrar
                                </Link>
                                <Link href={route('register')} className="text-sm font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                                    Criar Conta Grátis
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <div className="relative pt-36 pb-24 overflow-hidden bg-gray-50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-medium px-4 py-1.5 rounded-full border border-indigo-100 mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Plataforma all-in-one para gestão de negócios
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight mb-6 leading-none">
                        Muito mais que uma agenda.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            A gestão completa do seu negócio.
                        </span>
                    </h1>

                    <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto mb-10 font-light">
                        Automatize agendamentos, controle seu estoque com precisão e tenha clareza financeira em tempo real. Tudo em uma única plataforma.
                    </p>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link href={route('register')} className="bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-indigo-700 transition shadow-xl shadow-indigo-200">
                            Começar agora mesmo →
                        </Link>
                        <a href="#pilares" className="text-gray-500 font-medium text-lg px-8 py-4 rounded-full border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition">
                            Ver como funciona
                        </a>
                    </div>

                    {/* Mockup do dashboard */}
                    <div className="mt-16 mx-auto max-w-5xl">
                        <div className="rounded-2xl shadow-2xl border border-gray-200/60 bg-white p-2">
                            {/* Barra do browser */}
                            <div className="bg-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                                <span className="w-3 h-3 rounded-full bg-red-400" />
                                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                                <span className="w-3 h-3 rounded-full bg-green-400" />
                                <div className="ml-3 bg-white border border-gray-200 rounded-md px-3 py-0.5 text-xs text-gray-400 flex-1 max-w-xs text-left">
                                    app.agendapro.com.br/dashboard
                                </div>
                            </div>

                            {/* Corpo do dashboard */}
                            <div className="grid grid-cols-5 rounded-lg overflow-hidden border border-gray-100 min-h-72">
                                {/* Sidebar */}
                                <div className="col-span-1 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-1">
                                    <p className="text-xs font-black text-indigo-600 mb-3">AgendaPro</p>
                                    {['Dashboard', 'Agenda', 'Estoque', 'Financeiro', 'Equipe'].map((item, i) => (
                                        <div key={item} className={`text-xs px-2 py-1.5 rounded-md flex items-center gap-2 ${i === 0 ? 'bg-indigo-50 text-indigo-600 font-semibold border-r-2 border-indigo-500' : 'text-gray-400'}`}>
                                            <span className="w-2 h-2 rounded-sm bg-current opacity-50 flex-shrink-0" />
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                {/* Conteúdo */}
                                <div className="col-span-4 p-5 bg-white">
                                    <p className="text-sm font-bold text-gray-800 mb-4">Visão geral — Hoje</p>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {[
                                            { label: 'Faturamento', value: 'R$ 4.820', change: '↑ 12% vs ontem' },
                                            { label: 'Agendamentos', value: '23', change: '↑ 3 novos hoje' },
                                            { label: 'Ocupação', value: '87%', change: '↑ 5% esta semana' },
                                        ].map((stat) => (
                                            <div key={stat.label} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                                                <p className="text-xl font-black text-gray-900">{stat.value}</p>
                                                <p className="text-xs text-emerald-500 mt-0.5">{stat.change}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-indigo-50 rounded-xl p-3 flex items-end gap-1.5 h-16 mb-4">
                                        {barHeights.map((h, i) => (
                                            <div
                                                key={i}
                                                className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-indigo-600' : 'bg-indigo-300'}`}
                                                style={{ height: h }}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {[
                                            { time: '14:00', name: 'Ana Souza', tag: 'Coloração' },
                                            { time: '14:30', name: 'Carlos Lima', tag: 'Corte' },
                                        ].map((item) => (
                                            <div key={item.time} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs">
                                                <span className="text-gray-400 w-8">{item.time}</span>
                                                <span className="font-semibold text-gray-700 flex-1">{item.name}</span>
                                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-medium">{item.tag}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PILARES */}
            <div id="pilares" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Por que o AgendaPro?</span>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mt-3">Tudo o que você precisa para crescer</h2>
                        <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto font-light">
                            Três pilares integrados que trabalham juntos para automatizar sua operação.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="group bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Agenda Inteligente</h3>
                            <p className="text-gray-500 leading-relaxed font-light">
                                Gerencie horários e profissionais com facilidade. Evite choques de horário e reduza faltas com lembretes automáticos via WhatsApp.
                            </p>
                        </div>

                        <div className="group bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Estoque Integrado</h3>
                            <p className="text-gray-500 leading-relaxed font-light">
                                Crie receitas para seus serviços. Quando o atendimento é concluído, o sistema dá baixa automática nos insumos utilizados.
                            </p>
                        </div>

                        <div className="group bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Visão Executiva</h3>
                            <p className="text-gray-500 leading-relaxed font-light">
                                Tome decisões baseadas em dados. Veja seu faturamento, produtividade da equipe e alertas de estoque crítico em tempo real.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA FINAL */}
            <div className="bg-gradient-to-br from-indigo-700 to-purple-800 py-24">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
                        Pronto para profissionalizar sua gestão?
                    </h2>
                    <p className="text-indigo-200 mb-10 text-lg font-light">
                        Crie sua conta gratuitamente e comece a organizar seu negócio hoje mesmo.
                    </p>
                    <Link href={route('register')} className="bg-white text-indigo-700 font-bold text-lg px-10 py-4 rounded-full hover:bg-gray-50 transition shadow-2xl">
                        Criar minha conta grátis
                    </Link>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-white py-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} AgendaPro. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}