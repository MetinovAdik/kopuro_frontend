import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth, User as AuthUserType } from '../../contexts/AuthContext';
import {
    getAllUsersForAdmin,
    getUnconfirmedWorkersForAdmin,
    confirmWorkerForAdmin
} from '../../services/authService';
import AuthenticatedLayout from '../../components/AuthenticatedLayout';

export default function AdminPage() {
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [usersList, setUsersList] = useState<AuthUserType[]>([]);
    const [unconfirmedWorkersList, setUnconfirmedWorkersList] = useState<AuthUserType[]>([]);
    const [pageSpecificLoading, setPageSpecificLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || !user) {
                router.push(`/login?message=${encodeURIComponent('Admin access required. Please login.')}`);
                return;
            }
            if (user.role !== 'admin') {
                router.push(`/dashboard?message=${encodeURIComponent('Access denied. Admin privileges required.')}`);
                return;
            }
            fetchAdminPageData();
        }
    }, [isAuthenticated, user, authLoading, router]);

    const fetchAdminPageData = async () => {
        setPageSpecificLoading(true);
        setPageError('');
        try {
            const [allUsersData, unconfirmedWorkersData] = await Promise.all([
                getAllUsersForAdmin(),
                getUnconfirmedWorkersForAdmin()
            ]);
            setUsersList(allUsersData);
            setUnconfirmedWorkersList(unconfirmedWorkersData);
        } catch (err: any) {
            console.error('AdminPage: Failed to fetch admin data:', err);
            setPageError(err.response?.data?.detail || 'Could not load admin data. Please try again.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
            }
        } finally {
            setPageSpecificLoading(false);
        }
    };

    const handleConfirmWorker = async (userIdToConfirm: number) => {
        if (!window.confirm(`Are you sure you want to confirm worker with ID ${userIdToConfirm}?`)) return;
        try {
            await confirmWorkerForAdmin(userIdToConfirm);
            alert(`Worker ${userIdToConfirm} confirmed successfully!`);
            fetchAdminPageData();
        } catch (err: any) {
            console.error('AdminPage: Failed to confirm worker:', err);
            alert(err.response?.data?.detail || `Failed to confirm worker ${userIdToConfirm}.`);
        }
    };

    if (authLoading || (!user && !authLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg text-gray-700 dark:text-gray-300">Initializing Admin Panel...</p>
            </div>
        );
    }
    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg text-gray-700 dark:text-gray-300">Access Denied. Redirecting...</p>
            </div>
        );
    }
    if (pageSpecificLoading) {
        return (
            <AuthenticatedLayout pageTitle="Admin Panel">
                <div className="flex items-center justify-center py-10">
                    <p className="text-lg text-gray-700 dark:text-gray-300">Loading admin data...</p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout pageTitle="Admin Panel">
            {pageError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{pageError}</span>
                </div>
            )}

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Unconfirmed Workers ({unconfirmedWorkersList.length})</h2>
                {unconfirmedWorkersList.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No unconfirmed workers at the moment.</p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Full Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {unconfirmedWorkersList.map((worker) => (
                                <tr key={worker.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{worker.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{worker.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{worker.full_name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleConfirmWorker(worker.id)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                                        >
                                            Confirm
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">All Users ({usersList.length})</h2>
                {usersList.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No users found.</p>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Full Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Active</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Confirmed</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {usersList.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{u.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{u.full_name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100'}`}>
                            {u.role}
                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.is_active ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                      }`}>
                        {u.is_active ? 'Yes' : 'No'}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.is_confirmed_by_admin ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                      }`}>
                        {u.is_confirmed_by_admin ? 'Yes' : 'No'}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AuthenticatedLayout>
    );
}