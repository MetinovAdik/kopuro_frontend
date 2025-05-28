import Link from "next/link";
import Head from "next/head";
import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

const ShieldCheckIcon = ({ className = "w-16 h-16 mx-auto mb-6 text-indigo-600 dark:text-indigo-400" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622A11.99 11.99 0 0018.402 6a11.959 11.959 0 01-1.588-.036A11.87 11.87 0 0012 2.25z" />
    </svg>
);

const BriefcaseIcon = ({ className = "w-8 h-8 text-blue-500" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25v-4.073M15.75 8.25H8.25M12 11.25V21M12 3v2.25m0 0l-1.06.354a.75.75 0 00-.528 1.025l.623 1.871M12 5.25l1.06.354a.75.75 0 01.528 1.025l-.623 1.871m0 0M12 5.25V3m0 2.25A2.625 2.625 0 0014.625 3h-5.25A2.625 2.625 0 0012 5.25z" />
    </svg>
);

const UsersIcon = ({ className = "w-8 h-8 text-green-500" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

const InfoIcon = ({ className = "w-5 h-5 mr-2 text-sky-500 dark:text-sky-400" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);


export default function EmployeePortalPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const script = document.createElement('script');
        script.innerHTML = `
      (function() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      })();
    `;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            if (user.role === 'admin') {
                router.push('/admin');
            } else if (user.role === 'worker' && user.is_confirmed_by_admin && user.is_active) {
                router.push('/dashboard');
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading && !user) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <p className="text-slate-700 dark:text-slate-300 text-lg">Loading Portal...</p>
            </div>
        );
    }

    if (isAuthenticated && user && ((user.role === 'admin') || (user.role === 'worker' && user.is_confirmed_by_admin && user.is_active))) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <p className="text-slate-700 dark:text-slate-300 text-lg">Redirecting to your workspace...</p>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Портал для Сотрудников - КӨПҮРӨ</title>
                <meta name="description" content="Вход и регистрация для сотрудников государственной службы проекта КӨПҮРӨ." />
            </Head>
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
                {/* ... (header остается таким же) ... */}
                <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <Link href="/portal" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              КӨПҮРӨ
            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
              | Портал Сотрудника
            </span>
                        </Link>
                        <nav className="flex gap-4 lg:gap-6 items-center">
                            <Link
                                href="/login"
                                className="text-sm font-medium px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                Войти
                            </Link>
                            <Link
                                href="/register"
                                className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline"
                            >
                                Регистрация
                            </Link>
                            <button
                                onClick={() => {
                                    document.documentElement.classList.toggle('dark');
                                    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                                }}
                                className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                                aria-label="Toggle dark mode"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 7.758a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                </svg>
                            </button>
                        </nav>
                        <div className="md:hidden">
                            <button className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" onClick={() => alert("Mobile menu for portal - TBD")}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-grow">
                    <section className="text-center py-20 sm:py-32 bg-gradient-to-b from-indigo-100 dark:from-indigo-900/30 to-slate-50 dark:to-slate-900">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <ShieldCheckIcon />
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-400">
                                Портал для Сотрудников
                            </h1>
                            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-700 dark:text-slate-300">
                                Добро пожаловать в систему "КӨПҮРӨ". Войдите или зарегистрируйтесь для доступа к рабочим инструментам и управления обращениями граждан.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link
                                    href="/login"
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors transform hover:scale-105"
                                >
                                    Войти в систему
                                </Link>
                                <Link
                                    href="/register"
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-indigo-600 dark:border-indigo-400 text-base font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                    Зарегистрироваться
                                </Link>
                            </div>
                            <div className="mt-6 max-w-xl mx-auto text-sm text-slate-600 dark:text-slate-400 p-3 bg-sky-100 dark:bg-sky-900/50 border border-sky-300 dark:border-sky-700 rounded-md flex items-center justify-center">
                                <InfoIcon />
                                <span>После регистрации дождитесь подтверждения вашей учетной записи администратором.</span>
                            </div>
                        </div>
                    </section>

                    {/* ... (секция "Возможности Портала" остается такой же) ... */}
                    <section id="features" className="py-16 sm:py-24">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12 sm:mb-16">
                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                                    Возможности Портала
                                </h2>
                                <p className="mt-4 max-w-xl mx-auto text-lg text-slate-600 dark:text-slate-400">
                                    Эффективные инструменты для вашей работы и взаимодействия с обращениями граждан.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-start space-x-4">
                                    <BriefcaseIcon className="flex-shrink-0 mt-1 w-10 h-10 text-blue-500 dark:text-blue-400" />
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Управление Обращениями</h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Просмотр, обработка и отслеживание статуса обращений граждан, назначение ответственных. (Доступно после входа)
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-start space-x-4">
                                    <UsersIcon className="flex-shrink-0 mt-1 w-10 h-10 text-green-500 dark:text-green-400" />
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Администрирование Пользователей</h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Управление учетными записями сотрудников, подтверждение регистрации новых пользователей. (Доступно для администраторов)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>


                    <section id="how-to-start" className="py-16 sm:py-24 bg-indigo-600 dark:bg-indigo-700 text-white">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                                Начните Работу
                            </h2>
                            <p className="max-w-2xl mx-auto text-lg sm:text-xl mb-4 text-indigo-100 dark:text-indigo-200">
                                Если у вас уже есть учетная запись, войдите в систему. Если вы новый сотрудник, пожалуйста, пройдите процедуру регистрации.
                            </p>
                            <p className="max-w-2xl mx-auto text-lg sm:text-xl mb-8 text-indigo-100 dark:text-indigo-200 font-semibold">
                                После регистрации ваш аккаунт должен быть подтвержден ответственным администратором для получения полного доступа к платформе.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 dark:text-indigo-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors transform hover:scale-105"
                                >
                                    Перейти к Входу
                                </Link>
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center px-8 py-3 border border-indigo-200 dark:border-indigo-500 text-base font-medium rounded-md text-white dark:text-indigo-200 bg-transparent hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
                                >
                                    Вернуться на Сайт для Граждан
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ... (footer остается таким же) ... */}
                <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                        <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">КӨПҮРӨ | Портал Сотрудника</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            © {new Date().getFullYear()} Проект "КӨПҮРӨ". <br className="sm:hidden"/> Все права защищены.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            Разработано: techdragons
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}