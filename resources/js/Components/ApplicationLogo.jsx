import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const { app_settings } = usePage().props;
    const appLogo = app_settings?.app_logo;

    if (appLogo) {
        return (
            <img {...props} src={appLogo} alt="Application Logo" />
        );
    }

    return (
        <img {...props} src="/logo.png" alt="ROXY Logo" />
    );
}
