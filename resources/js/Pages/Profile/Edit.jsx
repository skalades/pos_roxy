import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import PageHeader from '@/Components/PageHeader';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Pengaturan Profil"
                    backHref={route('dashboard')}
                    subtitle="Kelola informasi akun dan keamanan Anda"
                />
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
