import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

// Matches Python Enums (assuming use_enum_values=True in Pydantic)
type UserSubmissionType = 'жалоба' | 'просьба';
type SeverityLevel = 'низкий' | 'средний' | 'высокий' | 'критический';
type IssueStatus =
    | 'new'
    | 'pending_analysis'
    | 'analyzed'
    | 'analysis_failed'
    | 'in_progress'
    | 'resolved'
    | 'rejected'
    | 'closed_unresolved'
    | 'pending_user_feedback'
    | 'closed'; // Added 'closed' as a distinct final status

interface IssueDetails {
    id: number;
    original_complaint_text: string;
    submission_type_by_user: UserSubmissionType | null;
    source: string; // Assuming SubmissionSource values are strings like "telegram", "webform"
    source_user_id: string;
    source_username?: string | null;
    user_first_name?: string | null;

    responsible_department?: string | null;
    complaint_type?: string | null; // e.g., "личная", "общегражданская"
    complaint_category?: string | null;
    complaint_subcategory?: string | null;
    address_text?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    district?: string | null;
    severity_level?: SeverityLevel | null;
    applicant_data?: string | null;
    other_details?: string | null;

    status: IssueStatus;
    llm_processing_error?: string | null;
    created_at: string; // datetime string
    updated_at?: string | null; // datetime string
    resolved_at?: string | null; // datetime string
    resolution_details?: string | null;
    user_feedback_on_resolution?: string | null;
}

const statusTranslations: Record<IssueStatus, string> = {
    new: 'Новая заявка',
    pending_analysis: 'Ожидает анализа',
    analyzed: 'Проанализировано',
    analysis_failed: 'Ошибка анализа',
    in_progress: 'В работе / Отправлено в ответственный орган',
    resolved: 'Решено / Рассмотрено',
    rejected: 'Отклонено',
    closed_unresolved: 'Закрыто (не решено)',
    pending_user_feedback: 'Ожидает вашего отзыва',
    closed: 'Закрыто',
};

const milestonesConfig: { key: IssueStatus; label: string }[] = [
    { key: 'new', label: 'Новая заявка' },
    { key: 'pending_analysis', label: 'Анализ заявки' },
    { key: 'analyzed', label: 'Проанализировано' },
    { key: 'in_progress', label: 'В работе' },
    { key: 'resolved', label: 'Решено' },
    { key: 'pending_user_feedback', label: 'Оценка решения' },
    { key: 'closed', label: 'Закрыто' },
];

const TrackComplaintPage: NextPage = () => {
    const router = useRouter();
    const [sourceUserId, setSourceUserId] = useState('');
    const [issues, setIssues] = useState<IssueDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    // For feedback forms
    const [feedbackText, setFeedbackText] = useState<Record<number, string>>({});
    const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState<Record<number, boolean>>({});
    const [feedbackError, setFeedbackError] = useState<Record<number, string | null>>({});


    const fetchIssues = async (userIdToSearch: string) => {
        setIsLoading(true);
        setError(null);
        // Don't clear issues immediately if we are re-fetching for feedback update
        // setIssues([]);
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
            if (data.length === 0 && !issues.length) { // only set error if no issues were previously loaded
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

    const performSearch = async (userIdToSearch: string) => {
        if (!userIdToSearch.trim()) {
            setError('Пожалуйста, введите ваш контакт (Email или Telegram ID).');
            setIssues([]);
            setSearched(true);
            return;
        }
        setIssues([]); // Clear previous results on new search
        await fetchIssues(userIdToSearch);
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
        // Clear query param from URL if user searches manually
        if (router.query.source_user_id) {
            router.replace('/track-complaint', undefined, { shallow: true });
        }
        await performSearch(sourceUserId);
    };

    const getMilestoneProgressStatus = (issueCurrentStatus: IssueStatus, milestoneTargetKey: IssueStatus) => {
        const targetMilestoneIndex = milestonesConfig.findIndex(m => m.key === milestoneTargetKey);

        // Determine the effective index the issue has reached or failed at within the milestonesConfig
        let effectiveIssueReachedIndex = -1;
        let issueFailed = false;

        if (issueCurrentStatus === 'analysis_failed') {
            effectiveIssueReachedIndex = milestonesConfig.findIndex(m => m.key === 'analyzed');
            issueFailed = true;
        } else if (issueCurrentStatus === 'rejected' || issueCurrentStatus === 'closed_unresolved') {
            // Assuming rejection/unresolved closure happens after 'in_progress' or at 'resolved' stage for timeline visualization
            // All prior milestones are 'completed'. The stage itself is not 'current' in the happy path.
            // Let's map 'rejected' to the 'in_progress' milestone and 'closed_unresolved' to 'resolved'
            if (issueCurrentStatus === 'rejected') {
                effectiveIssueReachedIndex = milestonesConfig.findIndex(m => m.key === 'in_progress');
            } else { // closed_unresolved
                effectiveIssueReachedIndex = milestonesConfig.findIndex(m => m.key === 'resolved');
            }
            // This is a terminal state, subsequent happy path milestones are skipped.
        } else {
            // For normal progression, find current status in milestones or map it.
            const directMatchIndex = milestonesConfig.findIndex(m => m.key === issueCurrentStatus);
            if (directMatchIndex !== -1) {
                effectiveIssueReachedIndex = directMatchIndex;
            } else { // Status not directly in milestones (e.g. older statuses if any, or intermediate)
                // This needs more sophisticated mapping if there are statuses not covered by milestones.
                // For now, assume all relevant statuses are in milestonesConfig or handled by specific cases above.
                // Fallback for safety, though ideally all statuses are covered:
                if (issueCurrentStatus === 'pending_analysis') effectiveIssueReachedIndex = milestonesConfig.findIndex(m => m.key === 'pending_analysis');
                else effectiveIssueReachedIndex = -1; // Unknown state relative to milestones
            }
        }

        if (targetMilestoneIndex < effectiveIssueReachedIndex) return 'completed';
        if (targetMilestoneIndex === effectiveIssueReachedIndex) {
            if (issueFailed && milestoneTargetKey === 'analyzed') return 'failed';
            // If current status is exactly this milestone, it's 'current'
            // Or if it's a terminal state that maps to this milestone as its last point of positive progression
            if (issueCurrentStatus === milestoneTargetKey ||
                (issueCurrentStatus === 'rejected' && milestoneTargetKey === 'in_progress') ||
                (issueCurrentStatus === 'closed_unresolved' && milestoneTargetKey === 'resolved')
            ) {
                return 'current'; // The issue's actual status aligns with this milestone step
            }
            // If issue has progressed past this milestone conceptually (e.g. status is 'analyzed', milestone is 'pending_analysis')
            // This case should be caught by `targetMilestoneIndex < effectiveIssueReachedIndex` if mapping is right.
            // But if `effectiveIssueReachedIndex` was for `analyzed` and current milestone is `analyzed`, and status is `analyzed`, it's current.

            // If the status is beyond this milestone, this milestone should be completed.
            // This primarily applies if issueCurrentStatus isn't in milestonesConfig but implies completion of earlier steps.
            // E.g. if `issueCurrentStatus` was `post_in_progress_custom_status` mapped to `effectiveIssueReachedIndex` of `in_progress`.
            // Then `in_progress` milestone is `current`. A milestone *before* it would be `completed`.
            // This complex mapping is simplified by ensuring milestonesConfig is comprehensive.
            const orderOfCurrentStatusInMilestones = milestonesConfig.findIndex(m => m.key === issueCurrentStatus);
            if (orderOfCurrentStatusInMilestones > targetMilestoneIndex) return 'completed';


            return 'current'; // Default for the matching index if not a special failure.
        }
        if (targetMilestoneIndex > effectiveIssueReachedIndex) {
            if (issueFailed && targetMilestoneIndex > milestonesConfig.findIndex(m => m.key === 'analyzed')) return 'skipped';
            if (issueCurrentStatus === 'rejected' && targetMilestoneIndex > milestonesConfig.findIndex(m => m.key === 'in_progress')) return 'skipped';
            if (issueCurrentStatus === 'closed_unresolved' && targetMilestoneIndex > milestonesConfig.findIndex(m => m.key === 'resolved')) return 'skipped';
            return 'pending';
        }
        return 'pending'; // Default fallback
    };

    const handleFeedbackSubmit = async (event: FormEvent<HTMLFormElement>, issueId: number) => {
        event.preventDefault();
        const currentFeedbackText = feedbackText[issueId];
        if (!currentFeedbackText || currentFeedbackText.trim().length < 1) {
            setFeedbackError(prev => ({ ...prev, [issueId]: 'Отзыв не может быть пустым.' }));
            return;
        }

        setIsFeedbackSubmitting(prev => ({ ...prev, [issueId]: true }));
        setFeedbackError(prev => ({ ...prev, [issueId]: null }));

        try {
            const response = await fetch(`/api/issue/${issueId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_feedback_on_resolution: currentFeedbackText.trim() }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`);
            }

            // Update UI:
            setIssues(prevIssues => prevIssues.map(issue =>
                issue.id === issueId
                    ? { ...issue, user_feedback_on_resolution: currentFeedbackText.trim(), status: issue.status === 'pending_user_feedback' ? 'closed' : issue.status } // Optionally change status to 'closed'
                    : issue
            ));
            setFeedbackText(prev => ({ ...prev, [issueId]: '' })); // Clear input

            // Optionally, re-fetch all issues for the user to get the freshest data,
            // especially if status might change server-side beyond just feedback text.
            // await fetchIssues(sourceUserId);

        } catch (err: any) {
            setFeedbackError(prev => ({ ...prev, [issueId]: err.message || 'Не удалось отправить отзыв.' }));
        } finally {
            setIsFeedbackSubmitting(prev => ({ ...prev, [issueId]: false }));
        }
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
                            {issues.map((issue) => {
                                const canLeaveFeedback = (issue.status === 'resolved' || issue.status === 'pending_user_feedback') && !issue.user_feedback_on_resolution;

                                return (
                                    <div key={issue.id} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                                        <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">ID: {issue.id} | Дата: {new Date(issue.created_at).toLocaleDateString('ru-RU')} {new Date(issue.created_at).toLocaleTimeString('ru-RU')}</p>
                                            <p className="mt-2 text-slate-800 dark:text-slate-100 break-words"><strong>Суть:</strong> {issue.original_complaint_text.length > 150 ? `${issue.original_complaint_text.substring(0, 150)}...` : issue.original_complaint_text}</p>
                                            {issue.responsible_department && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Ответственный орган (предположительно): {issue.responsible_department}</p>}
                                        </div>

                                        <div>
                                            <h4 className="text-md font-semibold mb-1 text-slate-700 dark:text-slate-200">Текущий статус:</h4>
                                            <p className={`font-medium mb-4 ${
                                                issue.status === 'analysis_failed' || issue.status === 'rejected' || issue.status === 'closed_unresolved'
                                                    ? 'text-red-500 dark:text-red-400'
                                                    : 'text-blue-600 dark:text-blue-400'
                                            }`}>
                                                {statusTranslations[issue.status] || issue.status}
                                            </p>

                                            <h4 className="text-md font-semibold mb-3 text-slate-700 dark:text-slate-200">Этапы рассмотрения:</h4>
                                            <div className="relative pl-1">
                                                <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-slate-300 dark:bg-slate-600 rounded-full" aria-hidden="true"></div>

                                                {milestonesConfig.map((milestone, index) => {
                                                    const progressStatus = getMilestoneProgressStatus(issue.status, milestone.key);
                                                    if (progressStatus === 'skipped' && milestone.key !== 'closed') return null; // Don't show skipped milestones, unless it's closed.

                                                    let circleClass = 'bg-slate-300 dark:bg-slate-600 ring-slate-400 dark:ring-slate-500';
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
                                                    } else if (progressStatus === 'skipped') {
                                                        // For skipped, use a lighter, disabled-like style
                                                        circleClass = 'bg-slate-200 dark:bg-slate-700 ring-slate-300 dark:ring-slate-600';
                                                        textClass = 'text-slate-400 dark:text-slate-500 line-through';
                                                    }


                                                    return (
                                                        <div key={milestone.key} className={`flex items-start mb-3 ${index === milestonesConfig.length -1 ? '' : 'pb-3' }`}>
                                                            <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center ring-2 ${circleClass} mr-3 mt-0.5`}>
                                                                {progressStatus === 'completed' && <span className="text-xs text-white">✓</span>}
                                                                {progressStatus === 'failed' && <span className="text-xs text-white">✗</span>}
                                                                {progressStatus === 'skipped' && <span className="text-xs text-slate-500 dark:text-slate-400">-</span>}
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
                                            {issue.resolution_details && (issue.status === 'resolved' || issue.status === 'pending_user_feedback' || issue.status === 'closed' || issue.status === 'closed_unresolved') && (
                                                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                    <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Детали решения:</h5>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{issue.resolution_details}</p>
                                                </div>
                                            )}

                                            {issue.user_feedback_on_resolution && (
                                                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                    <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Ваш отзыв о решении:</h5>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic whitespace-pre-wrap">"{issue.user_feedback_on_resolution}"</p>
                                                </div>
                                            )}

                                            {canLeaveFeedback && (
                                                <form onSubmit={(e) => handleFeedbackSubmit(e, issue.id)} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <label htmlFor={`feedback-${issue.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Оставить отзыв о решении:
                                                    </label>
                                                    <textarea
                                                        id={`feedback-${issue.id}`}
                                                        rows={3}
                                                        value={feedbackText[issue.id] || ''}
                                                        onChange={(e) => setFeedbackText(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                                        required
                                                        minLength={1}
                                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-50 text-sm"
                                                        placeholder="Пожалуйста, поделитесь вашим мнением о принятых мерах..."
                                                    />
                                                    {feedbackError[issue.id] && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{feedbackError[issue.id]}</p>}
                                                    <button
                                                        type="submit"
                                                        disabled={isFeedbackSubmitting[issue.id]}
                                                        className="mt-3 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50"
                                                    >
                                                        {isFeedbackSubmitting[issue.id] ? 'Отправка...' : 'Отправить отзыв'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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