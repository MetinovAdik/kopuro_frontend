import { useState, FormEvent } from 'react';
import { registerUser } from '../services/authService';
import Head from 'next/head';
import Link from 'next/link';


export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {

            await registerUser({
                email,
                full_name: fullName || undefined,
                password
            });
            setSuccess('Registration successful! Your account has been created. Please wait for an administrator to confirm your account before you can log in.');
            setEmail('');
            setFullName('');
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    const messages = err.response.data.detail.map((d: any) => {
                        const field = d.loc && d.loc.length > 1 ? d.loc[d.loc.length -1] : d.loc.join('.');
                        return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${d.msg}`;
                    }).join(' | ');
                    setError(messages);
                } else {
                    setError(err.response.data.detail);
                }
            } else {
                setError('Registration failed. An unexpected error occurred. Please try again.');
            }
            console.error("Registration page error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Register - Kopuro Service</title>
            </Head>
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-xl shadow-lg">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                            Create your account
                        </h2>
                    </div>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-200 px-4 py-3 rounded relative break-words my-4" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-200 px-4 py-3 rounded relative my-4" role="alert">
                            <strong className="font-bold">Success! </strong>
                            <span className="block sm:inline">{success}</span>
                        </div>
                    )}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                       className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                                       placeholder="Email address" />
                            </div>
                            <div>
                                <label htmlFor="full-name" className="sr-only">Full name (Optional)</label>
                                <input id="full-name" name="fullName" type="text" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                       className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                                       placeholder="Full name (Optional)" />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input id="password" name="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                       className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                                       placeholder="Password (min. 8 characters)" />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">Confirm password</label>
                                <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                       className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                                       placeholder="Confirm password" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" disabled={isLoading}
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                                {isLoading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}