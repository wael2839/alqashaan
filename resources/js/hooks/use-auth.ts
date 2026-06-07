import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function useAuth() {
    const { auth } = usePage<SharedData>().props;

    return {
        user: auth.user,
        isAdmin: auth.user?.role === 'admin',
        isViewer: auth.user?.role === 'viewer',
    };
}
