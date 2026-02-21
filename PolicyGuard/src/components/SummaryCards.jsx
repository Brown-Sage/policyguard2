export default function SummaryCards({ summary }) {
    if (!summary) return null

    return (
        <section>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100 tracking-tight">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 shadow-sm inline-flex">
                    📊
                </span>
                Analysis Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Score Card */}
                <div className="relative group rounded-3xl p-6 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Score
                        </div>
                        <div className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                            {summary.compliance_score ?? '-'}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out"></div>
                </div>

                {/* Records Card */}
                <div className="relative group rounded-3xl p-6 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="text-blue-500">📄</span> Total Records
                        </div>
                        <div className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white">
                            {summary.total_records.toLocaleString()}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out"></div>
                </div>

                {/* Rules Card */}
                <div className="relative group rounded-3xl p-6 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-none hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="text-emerald-500">⚖️</span> Total Rules
                        </div>
                        <div className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white">
                            {summary.total_rules.toLocaleString()}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out"></div>
                </div>

                {/* Violations Card */}
                <div className={`relative group rounded-3xl p-6 backdrop-blur-xl border shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden ${summary.violations_found > 0
                        ? 'bg-rose-50/80 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 shadow-rose-500/10 hover:shadow-rose-500/20'
                        : 'bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 shadow-emerald-500/10 hover:shadow-emerald-500/20'
                    }`}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className={summary.violations_found > 0 ? "text-rose-500" : "text-emerald-500"}>
                                {summary.violations_found > 0 ? "🚨" : "🛡️"}
                            </span>
                            Violations
                        </div>
                        <div className={`text-5xl font-black tracking-tighter ${summary.violations_found > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {summary.violations_found.toLocaleString()}
                        </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 h-1.5 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out ${summary.violations_found > 0 ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}></div>
                </div>

            </div>
        </section>
    )
}
