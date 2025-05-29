import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { NextPage } from 'next';
// import QRCodeStyling from 'qrcode.react'; // or import { QRCodeSVG } from 'qrcode.react';


// Matches backend UserSubmissionType enum values
type UserSubmissionType = 'жалоба' | 'просьба';

// Matches backend SubmissionSource enum values (assuming 'web_form' is one of them)
type SubmissionSourceValue = 'web_form' | 'telegram' | 'whatsapp' | 'other'; // Example values

// Matches backend SeverityLevel enum values
type SeverityLevel = 'низкий' | 'средний' | 'высокий' | 'критический';

// Matches backend IssueStatus enum values
type BackendIssueStatus =
    | 'new'
    | 'pending_analysis'
    | 'analyzed'
    | 'analysis_failed'
    | 'in_progress'
    | 'resolved'
    | 'rejected'
    | 'closed_unresolved'
    | 'pending_user_feedback'
    | 'closed';

interface IssueSubmissionItem {
    text: string;
    submission_type_by_user: UserSubmissionType;
    source: SubmissionSourceValue; // Hardcoded to 'web_form' in this component
    source_user_id: string;
    source_username?: string | null;
    user_first_name?: string | null;
}

// Corresponds to backend's LLMAnalysisResult Pydantic model
interface LLMAnalysisResult {
    responsible_department?: string | null;
    complaint_type?: string | null; // "личная" | "общегражданская" | null
    complaint_category?: string | null;
    complaint_subcategory?: string | null;
    address_text?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    district?: string | null;
    severity_level?: SeverityLevel | null;
    applicant_data?: string | null;
    other_details?: string | null;
}

// Corresponds to backend's SubmissionResponse Pydantic model
interface SubmissionResponse {
    saved_record_id: number;
    original_text: string;
    submission_type_by_user: UserSubmissionType;
    source: string; // Actual string value from SubmissionSource enum
    source_user_id: string;
    status: BackendIssueStatus;
    analysis?: LLMAnalysisResult | null;
    llm_processing_error?: string | null;
    message: string;
}

const statusTranslationsForSubmission: Partial<Record<BackendIssueStatus, string>> = {
    new: 'Новое',
    pending_analysis: 'Передано на анализ',
    analyzed: 'Успешно проанализировано',
    analysis_failed: 'Ошибка при автоматическом анализе',
    // Add more if other initial statuses are possible from submit-issue
};


const SubmitComplaintPage: NextPage = () => {
    const [text, setText] = useState('');
    const [submissionType, setSubmissionType] = useState<UserSubmissionType>('жалоба');
    const [sourceUserId, setSourceUserId] = useState('');
    const [sourceUsername, setSourceUsername] = useState('');
    const [userFirstName, setUserFirstName] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ message: string, id: number, initialStatus: string } | null>(null);
    // const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null); // Для QR

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessInfo(null);
        // setQrCodeUrl(null); // Для QR

        if (!sourceUserId.trim()) {
            setError('Пожалуйста, укажите ваш контактный Email или Telegram ID для отслеживания статуса.');
            setIsLoading(false);
            return;
        }

        const issueData: IssueSubmissionItem = {
            text,
            submission_type_by_user: submissionType,
            source: 'web_form', // Hardcoded for this form
            source_user_id: sourceUserId.trim(),
            source_username: sourceUsername.trim() || null,
            user_first_name: userFirstName.trim() || null,
        };

        try {
            const response = await fetch(`/api/submit-issue/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(issueData),
            });

            // The page will wait here until the backend (including LLM) responds.
            // The change is in how we present the success.

            const result: SubmissionResponse | { detail: any } = await response.json();

            if (!response.ok) {
                let errorMessage = `Ошибка сервера: ${response.statusText || response.status}`;
                if ('detail' in result && Array.isArray(result.detail)) {
                    errorMessage = result.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
                } else if (typeof (result as any)?.detail === 'string') {
                    errorMessage = (result as any).detail;
                } else if ('message' in result && typeof result.message === 'string') {
                    errorMessage = result.message || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const successResult = result as SubmissionResponse;

            const friendlyInitialStatus = statusTranslationsForSubmission[successResult.status] || successResult.status;

            setSuccessInfo({
                message: `Ваше обращение успешно получено и принято в обработку.`,
                id: successResult.saved_record_id,
                initialStatus: friendlyInitialStatus
            });

            // Optional: Generate URL for QR-code
            // if (sourceUserId.trim() && typeof window !== 'undefined') {
            //     const trackUrl = `${window.location.origin}/track-complaint?source_user_id=${encodeURIComponent(sourceUserId.trim())}`;
            //     setQrCodeUrl(trackUrl);
            // }

            setText(''); // Clear the main text field
            // Optionally keep contact details for subsequent submissions
            // setSubmissionType('жалоба'); // Reset submission type if needed

        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при отправке обращения.');
            console.error("Submission error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">КӨПҮРӨ</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/track-complaint" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Отследить обращение
                        </Link>
                        <Link href="/" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            На главную
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-xl">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center text-blue-700 dark:text-blue-400 mb-8">
                        Подать обращение
                    </h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md">
                            <p className="font-semibold">Ошибка:</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {successInfo && (
                        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-md">
                            <p className="font-semibold">Успешно!</p>
                            <p>{successInfo.message}</p>
                            <p>Номер вашего обращения: <strong>{successInfo.id}</strong>.</p>
                            <p>Начальный статус: <strong>{successInfo.initialStatus}</strong>.</p>
                            {sourceUserId && (
                                <p className="mt-2">
                                    Вы можете <Link href={`/track-complaint?source_user_id=${encodeURIComponent(sourceUserId)}`} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">отследить статус</Link> вашего обращения, используя контакт: {sourceUserId}.
                                </p>
                            )}
                            {/* Опционально: Отображение QR-кода */}
                            {/* {qrCodeUrl && (
                                <div className="mt-4 text-center">
                                <p className="mb-2">Отсканируйте QR-код для быстрого отслеживания:</p>
                                <div className="inline-block p-2 bg-white rounded-md">
                                    <QRCodeStyling value={qrCodeUrl} size={128} level="H" />
                                </div>
                                </div>
                            )} */}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="sourceUserId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Ваш контакт (Email или Telegram ID) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text" id="sourceUserId" value={sourceUserId} onChange={(e) => setSourceUserId(e.target.value)} required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-50"
                                placeholder="user@example.com или @mytelegramid"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Для отслеживания статуса вашего обращения.</p>
                        </div>

                        <div>
                            <label htmlFor="text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Текст обращения <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="text" rows={6} value={text} onChange={(e) => setText(e.target.value)} required minLength={1}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-50"
                                placeholder="Опишите вашу проблему или предложение..."
                            />
                        </div>

                        <div>
                            <label htmlFor="submissionType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Тип обращения <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="submissionType" value={submissionType} onChange={(e) => setSubmissionType(e.target.value as UserSubmissionType)} required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-50"
                            >
                                <option value="жалоба">Жалоба</option>
                                <option value="просьба">Просьба/Предложение</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="userFirstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Имя (необязательно)</label>
                                <input type="text" id="userFirstName" value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)}
                                       className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-50"
                                       placeholder="Асан"
                                />
                            </div>
                            <div>
                                <label htmlFor="sourceUsername" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Никнейм (необязательно)</label>
                                <input type="text" id="sourceUsername" value={sourceUsername} onChange={(e) => setSourceUsername(e.target.value)}
                                       className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-50"
                                       placeholder="super_asan"
                                />
                            </div>
                        </div>

                        <div>
                            <button type="submit" disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isLoading ? 'Отправка...' : 'Отправить обращение'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 mt-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">© {new Date().getFullYear()} Проект "КӨПҮРӨ".</p>
                </div>
            </footer>
        </div>
    );
};

export default SubmitComplaintPage;