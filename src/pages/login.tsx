import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { loginUser as apiLoginUser } from '../services/authService';
import Head from 'next/head';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login: authLogin, isAuthenticated, user, isLoading: authIsLoading } = useAuth();
    const router = useRouter();
    const { message: queryMessage } = router.query;

    useEffect(() => {
        if (!authIsLoading && isAuthenticated && user) {
            if (user.role === 'admin') {
                router.push('/admin');
            } else if (user.role === 'worker' && user.is_confirmed_by_admin && user.is_active) {
                router.push('/dashboard');
            }
            // Если он залогинен, но не должен быть здесь (например, воркер не подтвержден),
            // то authLogin в AuthContext или бэкенд должны были бы это обработать.
            // Здесь просто не редиректим, если условия не выполнены.
        }
    }, [isAuthenticated, user, authIsLoading, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const { token } = await apiLoginUser(email, password);
            await authLogin(token);
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Login failed. Please check your credentials or network connection.');
            }
            console.error("Login page error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authIsLoading && !error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-gray-700 dark:text-gray-300 text-lg">Loading...</p>
            </div>
        );
    }

    if (isAuthenticated && user && ((user.role === 'admin') || (user.role === 'worker' && user.is_confirmed_by_admin && user.is_active))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-gray-700 dark:text-gray-300 text-lg">You are already logged in. Redirecting...</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Login - Kopuro Service</title>
            </Head>
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-lg">
                    <div>
                        {/* Можно добавить логотип */}
                        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                            Sign in to Kopuro
                        </h1>
                    </div>
                    {queryMessage && typeof queryMessage === 'string' && (
                        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 p-4 my-4 rounded-md" role="alert">
                            <p>{decodeURIComponent(queryMessage)}</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-200 px-4 py-3 rounded relative my-4" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                        <input type="hidden" name="remember" defaultValue="true" />
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">
                                    Email address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting || authIsLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isSubmitting || (authIsLoading && !user) ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        No account?{' '}
                        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}