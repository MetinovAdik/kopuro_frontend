import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LabelList
} from 'recharts';


interface StatsItem {
    count: number;
}
interface StatsByCategoryItem extends StatsItem { category: string; }
interface StatsByStatusItem extends StatsItem { status: string; }
interface StatsByDepartmentItem extends StatsItem { department: string; }
interface StatsBySeverityItem extends StatsItem { severity: string; }

interface OverallStatsData {
    total_issues: number;
    by_category: StatsByCategoryItem[];
    by_status: StatsByStatusItem[];
    by_responsible_department: StatsByDepartmentItem[];
    by_severity: StatsBySeverityItem[];
}

interface TimeSeriesDataPoint {
    period: string;
    count: number;
}

interface TopProblematicAddress {
    address: string;
    complaint_count: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4519'];
const BAR_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE', '#00C49F'];


export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading, logout, token: authToken } = useAuth();
    const router = useRouter();

    const [overallStats, setOverallStats] = useState<OverallStatsData | null>(null);
    const [timelineData, setTimelineData] = useState<TimeSeriesDataPoint[]>([]);
    const [topAddresses, setTopAddresses] = useState<TopProblematicAddress[]>([]);

    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);


    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || !user) {
                router.push(`/login?message=${encodeURIComponent('Пожалуйста, войдите, чтобы получить доступ к вашей панели управления.')}`);
                return;
            }
            if (user.role === 'admin') {
                router.push('/admin');
                return;
            }
            if (user.role === 'worker') {
                if (!user.is_active || !user.is_confirmed_by_admin) {
                    logout();
                    router.push(`/login?message=${encodeURIComponent('Ваша учетная запись неактивна или не подтверждена. Пожалуйста, свяжитесь с администратором.')}`);
                    return;
                }
            }
        }
    }, [isAuthenticated, user, authLoading, router, logout]);


    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (isAuthenticated && user && user.role !== 'admin' && API_BASE_URL && authToken) {
            const fetchData = async () => {
                setIsLoadingStats(true);
                setStatsError(null);

                const headers = {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                };

                try {
                    const [overallRes, timelineRes, topAddressesRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/stats/overall`, { headers, signal }),
                        fetch(`${API_BASE_URL}/stats/timeline?group_by_period=day`, { headers, signal }),
                        fetch(`${API_BASE_URL}/stats/top_problematic_addresses?limit=10`, { headers, signal }),
                    ]);

                    if (signal.aborted) {
                        console.log("Запрос данных панели управления прерван (после Promise.all).");
                        return;
                    }

                    if (!overallRes.ok) throw new Error(`Не удалось загрузить общую статистику: ${overallRes.statusText} (Статус: ${overallRes.status})`);
                    const overallData = await overallRes.json();
                    if (signal.aborted) return;
                    setOverallStats(overallData);

                    if (!timelineRes.ok) throw new Error(`Не удалось загрузить данные временной шкалы: ${timelineRes.statusText} (Статус: ${timelineRes.status})`);
                    const timelineResult = await timelineRes.json();
                    if (signal.aborted) return;
                    setTimelineData(timelineResult);

                    if (!topAddressesRes.ok) throw new Error(`Не удалось загрузить топ адресов: ${topAddressesRes.statusText} (Статус: ${topAddressesRes.status})`);
                    const topAddressesData = await topAddressesRes.json();
                    if (signal.aborted) return;
                    setTopAddresses(topAddressesData);

                } catch (error: any) {
                    if (signal.aborted || error.name === 'AbortError') {
                        console.log("Запрос данных панели управления прерван очисткой или ошибкой.");
                        return;
                    }
                    console.error("Не удалось загрузить данные панели управления:", error);
                    setStatsError(error.message || "Произошла неизвестная ошибка при загрузке данных.");
                } finally {
                    if (!signal.aborted) {
                        setIsLoadingStats(false);
                    }
                }
            };

            fetchData();

            return () => {
                controller.abort();
            };
        } else if (!authLoading) {
            setOverallStats(null);
            setTimelineData([]);
            setTopAddresses([]);
            setIsLoadingStats(false);

            if (isAuthenticated && !authToken && router.pathname === '/dashboard') {
                console.warn("DashboardPage: Несогласованное состояние аутентификации. isAuthenticated true, но токен отсутствует.");
                setStatsError("Ошибка аутентификации. Пожалуйста, попробуйте выйти и войти снова.");
            }
        }
    }, [isAuthenticated, user, authLoading, authToken, API_BASE_URL, router.pathname, logout]);


    if (authLoading || (!user && !authLoading && !isAuthenticated)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg text-gray-700 dark:text-gray-300">Загрузка панели управления...</p>
            </div>
        );
    }

    if (!user || user.role === 'admin' || (user.role === 'worker' && (!user.is_active || !user.is_confirmed_by_admin))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg text-gray-700 dark:text-gray-300">Доступ запрещен или проблема с учетной записью. Перенаправление...</p>
            </div>
        );
    }

    const renderCustomizedLabelForPie = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent * 100 < 5) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                {`${name} (${value})`}
            </text>
        );
    };


    return (
        <AuthenticatedLayout pageTitle={`Добро пожаловать, ${user.full_name || user.email}!`}>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">Данные пользователя</p>
                <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Email:</span> {user.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Роль:</span>
                        <span className="ml-1 capitalize px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100">
                            {user.role === 'user' ? 'Пользователь' : user.role === 'worker' ? 'Работник' : user.role}
                        </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Статус учетной записи:</span>
                        <span className={`ml-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                            {user.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                        ,
                        <span className={`ml-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_confirmed_by_admin ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'}`}>
                            {user.is_confirmed_by_admin ? 'Подтверждена администратором' : 'Ожидает подтверждения администратором'}
                        </span>
                    </p>
                </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Панель управления обращениями</h2>

            {isLoadingStats && (
                <div className="min-h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg">
                    <p className="text-lg text-gray-700 dark:text-gray-300">Загрузка данных по обращениям...</p>
                </div>
            )}
            {statsError && !isLoadingStats && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <strong className="font-bold">Ошибка:</strong>
                    <span className="block sm:inline"> {statsError}</span>
                </div>
            )}

            {!isLoadingStats && !statsError && overallStats && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
                            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Всего обращений</h3>
                            <p className="mt-1 text-4xl font-semibold text-indigo-600 dark:text-indigo-400">
                                {overallStats.total_issues}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Обращения по статусу</h3>
                            {overallStats.by_status.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={overallStats.by_status}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabelForPie}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="count"
                                            nameKey="status"
                                        >
                                            {overallStats.by_status.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number, name: string) => [`${value} обращений`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p className="text-gray-500 dark:text-gray-400">Нет данных по статусам.</p>}
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Обращения по категории</h3>
                            {overallStats.by_category.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={overallStats.by_category} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="category" type="category" width={100} interval={0} />
                                        <Tooltip formatter={(value: number, name: string) => [value, name === 'count' ? 'Количество' : name]} />
                                        <Legend formatter={(value) => value === 'count' ? 'Количество' : value} />
                                        <Bar dataKey="count" fill={BAR_COLORS[0]} name="Количество">
                                            <LabelList dataKey="count" position="right" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-gray-500 dark:text-gray-400">Нет данных по категориям.</p>}
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Обращения по отделу</h3>
                            {overallStats.by_responsible_department.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={overallStats.by_responsible_department} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="department" type="category" width={120} interval={0}/>
                                        <Tooltip formatter={(value: number, name: string) => [value, name === 'count' ? 'Количество' : name]} />
                                        <Legend formatter={(value) => value === 'count' ? 'Количество' : value} />
                                        <Bar dataKey="count" fill={BAR_COLORS[1]} name="Количество">
                                            <LabelList dataKey="count" position="right" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-gray-500 dark:text-gray-400">Нет данных по отделам.</p>}
                        </div>

                        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Обращения по серьезности</h3>
                            {overallStats.by_severity.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={overallStats.by_severity}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabelForPie}
                                            outerRadius={100}
                                            fill="#82ca9d"
                                            dataKey="count"
                                            nameKey="severity"
                                        >
                                            {overallStats.by_severity.map((entry, index) => (
                                                <Cell key={`cell-severity-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number, name: string) => [`${value} обращений`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p className="text-gray-500 dark:text-gray-400">Нет данных по серьезности.</p>}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Обращения по времени (по дням)</h3>
                        {timelineData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip formatter={(value: number, name: string) => [value, name === 'count' ? 'Обращения' : name]} />
                                    <Legend formatter={(value) => value === 'count' ? 'Обращения' : value} />
                                    <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Обращения"/>
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <p className="text-gray-500 dark:text-gray-400">Нет данных по времени.</p>}
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Топ 10 проблемных адресов</h3>
                        {topAddresses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Адрес
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Количество обращений
                                        </th>
                                    </tr>

                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {topAddresses.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.address}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.complaint_count}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-gray-500 dark:text-gray-400">Нет данных по проблемным адресам.</p>}
                    </div>
                </>
            )}
        </AuthenticatedLayout>
    );
}