import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

interface IssueDetails {
    id: number;
    original_complaint: string;
    submission_type_by_user: 'жалоба' | 'просьба' | null;
    source: string;
    source_user_id: string;
    source_username?: string | null;
    user_first_name?: string | null;
    responsible_department?: string | null;
    complaint_type?: string | null;
    address?: string | null;
    status: 'new' | 'analyzed' | 'processing' | 'resolved' | 'closed' | 'analysis_failed';
    llm_processing_error?: string | null;
    created_at: string;
}

const statusTranslations: Record<IssueDetails['status'], string> = {
    new: 'Новая заявка',
    analyzed: 'Проанализировано',
    processing: 'В работе / Отправлено в ответственный орган',
    resolved: 'Решено / Рассмотрено',
    closed: 'Закрыто',
    analysis_failed: 'Ошибка анализа',
};

// Определяем порядок и отображаемые имена для майлстоунов
const milestonesConfig: { key: IssueDetails['status']; label: string }[] = [
    { key: 'new', label: 'Новая заявка' },
    { key: 'analyzed', label: 'Проанализировано' },
    { key: 'processing', label: 'Отправлено в отв. орган / В работе' }, // Объединим для простоты
    { key: 'resolved', label: 'Рассмотрено / Решено' },
    { key: 'closed', label: 'Закрыто' },
];


const TrackComplaintPage: NextPage = () => {
    const router = useRouter();
    const [sourceUserId, setSourceUserId] = useState('');
    const [issues, setIssues] = useState<IssueDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const performSearch = async (userIdToSearch: string) => {
        if (!userIdToSearch.trim()) {
            setError('Пожалуйста, введите ваш контакт (Email или Telegram ID).');
            setIssues([]);
            setSearched(true); // Пометим, что поиск был, но неудачный из-за пустого ввода
            return;
        }
        setIsLoading(true);
        setError(null);
        setIssues([]);
        setSearched(true);

        try {
            const response = await fetch(`/api/issues/?source_user_id=${encodeURIComponent(userIdToSearch.trim())}&limit=100`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = `Ошибка сервера: ${response.statusText || response.status}`;
                if (errorData.detail && Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map((err: any) => `${err.loc.join('.')} - ${err.msg}`).join('; ');
                } else if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                }
                throw new Error(errorMessage);
            }

            const data: IssueDetails[] = await response.json();
            if (data.length === 0) {
                setError('Для указанного контакта обращений не найдено. Проверьте правильность ввода или попробуйте позже.');
            }
            setIssues(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при получении данных.');
            console.error("Tracking error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (router.isReady && router.query.source_user_id && typeof router.query.source_user_id === 'string') {
            const userIdFromQuery = router.query.source_user_id;
            setSourceUserId(userIdFromQuery);
            performSearch(userIdFromQuery);
        }
    }, [router.isReady, router.query.source_user_id]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (router.query.source_user_id) {
            router.replace('/track-complaint', undefined, { shallow: true });
        }
        await performSearch(sourceUserId);
    };

    const getMilestoneProgressStatus = (issueCurrentStatus: IssueDetails['status'], milestoneTargetStatus: IssueDetails['status']) => {
        const issueStatusOrder = milestonesConfig.findIndex(m => m.key === issueCurrentStatus);
        const milestoneOrderIndex = milestonesConfig.findIndex(m => m.key === milestoneTargetStatus);

        if (issueCurrentStatus === 'analysis_failed') {
            if (milestoneTargetStatus === 'analyzed') return 'failed'; // Этап анализа провален
            if (milestoneOrderIndex > milestonesConfig.findIndex(m => m.key === 'analyzed')) return 'skipped'; // Последующие этапы пропускаются
        }

        if (milestoneOrderIndex < issueStatusOrder) return 'completed';
        if (milestoneOrderIndex === issueStatusOrder) return 'current';
        return 'pending';
    };


    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              КӨПҮРӨ
            </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/submit-complaint" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Подать обращение
                        </Link>
                        <Link href="/" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            На главную
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center text-blue-700 dark:text-blue-400 mb-8">
                        Отследить обращение
                    </h1>

                    <form onSubmit={handleSubmit} className="mb-10 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                        <label htmlFor="sourceUserIdTrack" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Ваш контакт (Email или Telegram ID):
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                id="sourceUserIdTrack"
                                value={sourceUserId}
                                onChange={(e) => setSourceUserId(e.target.value)}
                                required
                                className="flex-grow px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-50"
                                placeholder="user@example.com или @mytelegramid"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isLoading ? 'Поиск...' : 'Найти'}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md text-center">
                            <p>{error}</p>
                        </div>
                    )}

                    {searched && !isLoading && !error && issues.length > 0 && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Ваши обращения:</h2>
                            {issues.map((issue) => (
                                <div key={issue.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">ID: {issue.id} | Дата: {new Date(issue.created_at).toLocaleDateString('ru-RU')} {new Date(issue.created_at).toLocaleTimeString('ru-RU')}</p>
                                        <p className="mt-2 text-slate-800 dark:text-slate-100 break-words"><strong>Суть:</strong> {issue.original_complaint.length > 150 ? `${issue.original_complaint.substring(0, 150)}...` : issue.original_complaint}</p>
                                        {issue.responsible_department && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Ответственный орган (предположительно): {issue.responsible_department}</p>}
                                    </div>

                                    <div>
                                        <h4 className="text-md font-semibold mb-1 text-slate-700 dark:text-slate-200">Текущий статус:</h4>
                                        <p className={`font-medium mb-4 ${issue.status === 'analysis_failed' ? 'text-red-500 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {statusTranslations[issue.status] || issue.status}
                                        </p>

                                        <h4 className="text-md font-semibold mb-3 text-slate-700 dark:text-slate-200">Этапы рассмотрения:</h4>
                                        <div className="relative pl-1"> {/* Контейнер для линии */}
                                            {/* Вертикальная линия */}
                                            <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-slate-300 dark:bg-slate-600 rounded-full" aria-hidden="true"></div>

                                            {milestonesConfig.map((milestone, index) => {
                                                if (issue.status === 'analysis_failed' && milestone.key !== 'new' && milestone.key !== 'analyzed') {
                                                    return null; // Не показываем последующие этапы, если анализ упал
                                                }
                                                const progressStatus = getMilestoneProgressStatus(issue.status, milestone.key);

                                                let circleClass = 'bg-slate-300 dark:bg-slate-600 ring-slate-400 dark:ring-slate-500'; // pending
                                                let textClass = 'text-slate-600 dark:text-slate-400';

                                                if (progressStatus === 'completed') {
                                                    circleClass = 'bg-green-500 dark:bg-green-600 ring-green-600 dark:ring-green-700';
                                                    textClass = 'text-green-700 dark:text-green-300 font-medium';
                                                } else if (progressStatus === 'current') {
                                                    circleClass = 'bg-blue-500 dark:bg-blue-600 ring-blue-600 dark:ring-blue-700';
                                                    textClass = 'text-blue-700 dark:text-blue-300 font-semibold';
                                                } else if (progressStatus === 'failed') {
                                                    circleClass = 'bg-red-500 dark:bg-red-600 ring-red-600 dark:ring-red-700';
                                                    textClass = 'text-red-700 dark:text-red-400 font-semibold';
                                                }

                                                return (
                                                    <div key={milestone.key} className={`flex items-start mb-3 ${index === milestonesConfig.length -1 || (issue.status === 'analysis_failed' && milestone.key === 'analyzed') ? '' : 'pb-3' }`}>
                                                        <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center ring-2 ${circleClass} mr-3 mt-0.5`}>
                                                            {progressStatus === 'completed' && <span className="text-xs text-white">✓</span>}
                                                            {progressStatus === 'failed' && <span className="text-xs text-white">✗</span>}
                                                        </div>
                                                        <span className={`text-sm ${textClass}`}>
                                        {milestone.label}
                                                            {progressStatus === 'failed' && milestone.key === 'analyzed' && " (Ошибка)"}
                                    </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {issue.llm_processing_error && issue.status === 'analysis_failed' && (
                                            <p className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded">Примечание по ошибке анализа: {issue.llm_processing_error}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {searched && !isLoading && !error && issues.length === 0 && (
                        <p className="text-center text-slate-600 dark:text-slate-400 py-10">Для указанного контакта обращений не найдено.</p>
                    )}
                </div>
            </main>

            <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 mt-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        © {new Date().getFullYear()} Проект "КӨПҮРӨ".
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default TrackComplaintPage;