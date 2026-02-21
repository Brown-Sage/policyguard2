export default function PolicyDocuments({ setActiveTab }) {
    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Policy Documents</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and view your organization's compliance criteria.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <span className="text-6xl mb-4">🗂️</span>
                <h3 className="text-xl font-bold mb-2">Policy Repository</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    This feature is currently in development for the hackathon MVP. In the future, you will be able to store, version, and manage text and PDF policies globally across your team.
                </p>
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-6 px-6 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    )
}
