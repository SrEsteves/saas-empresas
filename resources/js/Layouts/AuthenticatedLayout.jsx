import Dropdown from '@/Components/Dropdown';
import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const notifications = usePage().props.auth.notifications || [];
    const [mobileOpen, setMobileOpen] = useState(false);

    const markAsRead = () => {
        if (notifications.length > 0) {
            router.post(route('notifications.read'));
        }
    };

    const navGroups = [
        {
            label: null,
            items: [
                {
                    label: 'Dashboard',
                    href: route('dashboard'),
                    active: route().current('dashboard'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    ),
                },
            ],
        },
        {
            label: 'Agendamento',
            items: [
                {
                    label: 'Agenda',
                    href: route('appointments.index'),
                    active: route().current('appointments.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ),
                },
                {
                    label: 'Serviços',
                    href: route('services.index'),
                    active: route().current('services.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    ),
                },
                {
                    label: 'Colaboradores',
                    href: route('employees.index'),
                    active: route().current('employees.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    ),
                },
                {
                    label: 'WhatsApp & Bot',
                    href: route('whatsapp.index'),
                    active: route().current('whatsapp.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    ),
                },
                {
                    label: 'Configurações',
                    href: route('settings.edit'),
                    active: route().current('settings.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    ),
                },
            ],
        },
        {
            label: 'Estoque',
            items: [
                {
                    label: 'Produtos',
                    href: route('products.index'),
                    active: route().current('products.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    ),
                },
                {
                    label: 'Categorias',
                    href: route('categories.index'),
                    active: route().current('categories.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    ),
                },
                {
                    label: 'Extrato / Auditoria',
                    href: route('stock.movements'),
                    active: route().current('stock.*'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    ),
                },
            ],
        },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-gray-100">
                <Link href={route('dashboard')} className="text-xl font-black text-indigo-600 tracking-tighter">
                    Agenda<span className="text-gray-900">Pro</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
                {navGroups.map((group, gi) => (
                    <div key={gi}>
                        {group.label && (
                            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                                        item.active
                                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                                    }`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span className={item.active ? 'text-indigo-500' : 'text-gray-400'}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                    {item.active && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Rodapé da sidebar — usuário */}
            <div className="px-3 py-4 border-t border-gray-100">
                <Dropdown>
                    <Dropdown.Trigger>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition text-left">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content contentClasses="absolute bottom-full left-full mb-2 w-full min-w-[200px] bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                        <Dropdown.Link href={route('profile.edit')}>Perfil</Dropdown.Link>
                        <Dropdown.Link href={route('logout')} method="post" as="button">Sair</Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 selection:bg-indigo-500 selection:text-white flex">

            {/* SIDEBAR DESKTOP */}
            <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-40">
                <SidebarContent />
            </aside>

            {/* OVERLAY MOBILE */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* SIDEBAR MOBILE */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 transform transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

                {/* TOPBAR */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4 sm:px-6 justify-between gap-4">
                    {/* Botão hamburger mobile */}
                    <button
                        className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        onClick={() => setMobileOpen(true)}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Header dinâmico */}
                    <div className="flex-1">
                        {header}
                    </div>

                    {/* Notificações */}
                    <div className="flex items-center gap-2">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                                    title="Notificações"
                                    onClick={markAsRead}
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <div className="px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500 bg-gray-50">
                                    Notificações ({notifications.length})
                                </div>
                                {notifications.length > 0 ? (
                                    <div className="max-h-60 overflow-y-auto">
                                        {notifications.map((notif) => (
                                            <div key={notif.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex justify-between items-center group/item">
                                                <div>
                                                    <p className="text-gray-800 text-sm font-medium">🙋‍♂️ Atendente Solicitado</p>
                                                    <p className="text-gray-500 text-xs mt-1">WhatsApp: {notif.data.phone}</p>
                                                </div>
                                                <Link
                                                    href={route('notifications.read.single', notif.id)}
                                                    method="post"
                                                    as="button"
                                                    className="p-1 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded transition opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                                                    title="Marcar como resolvido"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                                        Nenhuma notificação nova.
                                    </div>
                                )}
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* CONTEÚDO DA PÁGINA */}
                <main className="flex-1 bg-gray-100">
                    {children}
                </main>
            </div>
        </div>
    );
}