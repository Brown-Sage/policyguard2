export default function Sidebar({ username, onLogout, darkMode, setDarkMode, activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
    return (
        <>
            {/* MOBILE SIDEBAR OVERLAY */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50
        flex flex-col transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* LOGO AREA */}
                <div className="h-20 flex items-center gap-4 px-8 border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white text-lg" role="img" aria-label="shield">🛡️</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            PolicyGuard
                        </h1>
                    </div>
                </div>

                {/* NAVIGATION LINKS */}
                <nav className="flex-1 px-4 py-8 space-y-2.5">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${activeTab === 'dashboard'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border border-transparent'
                            }`}
                    >
                        <span className={`text-xl transition-transform duration-200 ${activeTab === 'dashboard' ? 'scale-110' : 'grayscale opacity-70'}`}>📊</span>
                        Dashboard
                    </button>

                    <button
                        onClick={() => { setActiveTab('violations'); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${activeTab === 'violations'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border border-transparent'
                            }`}
                    >
                        <span className={`text-xl transition-transform duration-200 ${activeTab === 'violations' ? 'scale-110' : 'grayscale opacity-70'}`}>🚨</span>
                        All Violations
                    </button>

                    <button
                        onClick={() => { setActiveTab('policies'); setSidebarOpen(false) }}
                        className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl font-semibold transition-all duration-200 ${activeTab === 'policies'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50'
                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border border-transparent'
                            }`}
                    >
                        <span className={`text-xl transition-transform duration-200 ${activeTab === 'policies' ? 'scale-110' : 'grayscale opacity-70'}`}>📁</span>
                        Policy Documents
                    </button>
                </nav>

                {/* SIDEBAR FOOTER */}
                <div className="p-6 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-blue-500/30 shrink-0">
                                {username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Signed in as</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{username}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 transition-all shadow-sm hover:shadow active:scale-[0.98] mb-2"
                            aria-label="Toggle Dark Mode"
                        >
                            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                            <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-500 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-[0.98]"
                        >
                            <span>Sign Out</span>
                            <span>🚪</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
