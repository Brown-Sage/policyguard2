export default function ViolationsTable({ violations }) {
    if (!violations) return null

    return (
        <section className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-lg shadow-slate-200/20 dark:shadow-none border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mt-2">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-white/40 dark:bg-slate-800/40">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 tracking-tight">
                    <span className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/30 shadow-sm inline-flex">
                        📋
                    </span>
                    Violations Detail
                    <span className="ml-3 px-3 py-1 rounded-full text-xs font-black tracking-widest bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50 shadow-inner">
                        {violations.length} FOUND
                    </span>
                </h3>
            </div>

            {violations.length === 0 ? (
                <div className="p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 mb-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border-4 border-emerald-100 dark:border-emerald-800/30 shadow-inner">
                        <span className="text-5xl block">✨</span>
                    </div>
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400">Perfectly Compliant!</p>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md">Your dataset was analyzed successfully and no policy violations were found. Great job.</p>
                </div>
            ) : (
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap lg:whitespace-normal">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-widest border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-5">Employee ID</th>
                                <th className="px-6 py-5">Rule ID</th>
                                <th className="px-6 py-5 min-w-[300px]">Description</th>
                                <th className="px-6 py-5">Severity</th>
                                <th className="px-6 py-5">Time Detected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                            {violations.map((v, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200 group">
                                    <td className="px-6 py-5 align-top">
                                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-mono text-xs font-bold border border-blue-200/50 dark:border-blue-800/30 shadow-sm group-hover:scale-105 transition-transform origin-left">
                                            EMP-{v.employee_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <code className="inline-flex text-purple-700 dark:text-purple-400 font-bold bg-purple-50/80 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg text-xs border border-purple-200/50 dark:border-purple-800/30 shadow-sm group-hover:scale-105 transition-transform origin-left">
                                            RUL-{v.rule_id}
                                        </code>
                                    </td>
                                    <td className="px-6 py-5 align-top text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                        {v.description || 'No description provided.'}
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        {/* Map severity colors */}
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${v.severity === 'High' ? 'bg-rose-50/80 text-rose-700 border-rose-200/50 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' :
                                                v.severity === 'Medium' ? 'bg-amber-50/80 text-amber-700 border-amber-200/50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' :
                                                    'bg-blue-50/80 text-blue-700 border-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${v.severity === 'High' ? 'bg-rose-500' : v.severity === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                            {v.severity || 'Medium'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 align-top text-slate-500 dark:text-slate-400 text-xs font-medium">
                                        {new Date(v.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
