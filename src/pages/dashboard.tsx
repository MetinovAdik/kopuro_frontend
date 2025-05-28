// src/pages/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import AuthenticatedLayout from '../components/AuthenticatedLayout';

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || !user) {
                router.push(`/login?message=${encodeURIComponent('Please login to access your dashboard.')}`);
                return;
            }
            if (user.role === 'admin') {
                router.push('/admin');
                return;
            }
            if (user.role === 'worker') {
                if (!user.is_active || !user.is_confirmed_by_admin) {
                    logout();
                    router.push(`/login?message=${encodeURIComponent('Your account is not active or not confirmed. Please contact an administrator.')}`);
                    return;
                }
            }
        }
    }, [isAuthenticated, user, authLoading, router, logout]);

    if (authLoading || (!user && !authLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg text-gray-700 dark:text-gray-300">Loading Dashboard...</p>
            </div>
        );
    }

    if (!user || user.role === 'admin' || (user.role === 'worker' && (!user.is_active || !user.is_confirmed_by_admin))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg text-gray-700 dark:text-gray-300">Access Denied or Account Issue. Redirecting...</p>
            </div>
        );
    }

    return (
        <AuthenticatedLayout pageTitle={`Welcome, ${user.full_name || user.email}!`}>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                <p className="text-lg text-gray-700 dark:text-gray-300">This is your personal dashboard.</p>
                <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Email:</span> {user.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Role:</span>
                        <span className="ml-1 capitalize px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100">
                    {user.role}
                </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Account Status:</span>
                        <span className={`ml-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                </span>
                        ,
                        <span className={`ml-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_confirmed_by_admin ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'}`}>
                    {user.is_confirmed_by_admin ? 'Confirmed by Admin' : 'Awaiting Admin Confirmation'}
                </span>
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}