import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <Link href="/">
                        <ApplicationLogo className="mx-auto h-16 w-auto text-3xl" />
                    </Link>
                    <p className="mt-4 text-center text-sm text-gray-600">
                        Sistema de agendamento para seu negócio
                    </p>
                </div>

                <div className="mt-8">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
