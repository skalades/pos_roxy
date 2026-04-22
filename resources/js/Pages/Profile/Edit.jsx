import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-roxy-primary rounded-full shadow-[0_0_15px_rgba(13,148,136,0.5)]"></div>
                    <h2 className="text-3xl font-black font-heading leading-tight text-roxy-accent tracking-tight">
                        Pengaturan Profil
                    </h2>
                    <p className="text-sm text-roxy-text-muted mt-1 font-medium">Kelola informasi akun dan keamanan Anda</p>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="space-y-8 pb-12">
                <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-slate-900/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
