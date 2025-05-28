import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Head from 'next/head';

interface AuthenticatedLayoutProps {
    children: ReactNode;
    pageTitle: string;
}

export default function AuthenticatedLayout({ children, pageTitle }: AuthenticatedLayoutProps) {
    const { user, logout } = useAuth();

    return (
        <>
            <Head>
                <title>{pageTitle} - Kopuro Service</title>
            </Head>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <nav className="bg-white dark:bg-gray-800 shadow-md">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <Link href={user?.role === 'admin' ? "/admin" : "/dashboard"} className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                                    Kopuro Employee Portal
                                </Link>
                            </div>
                            <div className="flex items-center">
                                {user && (
                                    <span className="mr-4 text-sm text-gray-600 dark:text-gray-300">
                    Hello, {user.full_name || user.email} ({user.role})
                  </span>
                                )}
                                <button
                                    onClick={logout}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-sm shadow transition duration-150 ease-in-out"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main>
                    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">{pageTitle}</h1>
                        {children}
                    </div>
                </main>

                <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
                    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} Kopuro Auth Service. All rights reserved.
                    </div>
                </footer>
            </div>
        </>
    );
}