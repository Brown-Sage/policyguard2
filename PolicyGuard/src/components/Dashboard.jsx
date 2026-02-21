import { useState, useRef, useEffect } from 'react'
import SummaryCards from './SummaryCards'
import ViolationsTable from './ViolationsTable'

const BASE_URL = 'http://localhost:8000'

export default function Dashboard({ userId }) {

    // Form states
    const [pdfFile, setPdfFile] = useState(null)
    const [datasetUrl, setDatasetUrl] = useState('')
    const [lastRunUrl, setLastRunUrl] = useState(null)

    // Request states
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Data states
    const [summary, setSummary] = useState(null)
    const [violations, setViolations] = useState([])
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)

    // UI state
    const [dragOver, setDragOver] = useState(false)
    const fileRef = useRef()

    // Initial fetch
    useEffect(() => {
        fetchHistory()
    }, [userId])

    async function fetchHistory() {
        setHistoryLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/history/${userId}`)
            if (!res.ok) throw new Error(`History fetch failed: ${res.status}`)
            const data = await res.json()
            const sorted = (data.reports || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            setHistory(sorted)
        } catch (e) {
            console.warn('History fetch error:', e.message)
        } finally {
            setHistoryLoading(false)
        }
    }

    async function runAnalysis(urlToUse) {
        if (!pdfFile) { setError('Please select a Policy PDF file.'); return }
        if (!urlToUse.trim()) { setError('Please enter a Dataset URL.'); return }

        setError('')
        setLoading(true)
        setSummary(null)
        setViolations([])

        try {
            const formData = new FormData()
            formData.append('policy_pdf', pdfFile)
            formData.append('dataset_url', urlToUse.trim())
            formData.append('user_id', userId)

            const res = await fetch(`${BASE_URL}/analyze`, {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(`Analysis failed (${res.status}): ${text}`)
            }

            const data = await res.json()
            setSummary(data.summary)
            setViolations(data.violations || [])
            setLastRunUrl(urlToUse.trim())
            await fetchHistory()
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function handleAnalyze() { runAnalysis(datasetUrl) }
    function handleReRun() {
        if (lastRunUrl) {
            setDatasetUrl(lastRunUrl)
            runAnalysis(lastRunUrl)
        }
    }

    function handleDrop(e) {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type === 'application/pdf') {
            setPdfFile(file); setError('')
        } else {
            setError('Only PDF files are accepted.')
        }
    }

    function handleFileChange(e) {
        const file = e.target.files[0]
        if (file) { setPdfFile(file); setError('') }
    }

    // Trend indicator logic
    function getTrend() {
        if (history.length < 2) return null
        const latest = history[0]
        const previous = history[1]
        const diff = latest.violations_found - previous.violations_found
        if (diff > 0) return { direction: 'up', label: 'Increased', color: 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border-rose-200/50 dark:border-rose-800/50', value: diff }
        if (diff < 0) return { direction: 'down', label: 'Decreased', color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50', value: Math.abs(diff) }
        return { direction: 'flat', label: 'Unchanged', color: 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50', value: 0 }
    }
    const trend = getTrend()

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Compliance Overview</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">Upload policies and track your AI agent datasets securely.</p>
                </div>
            </div>

            {/* INPUT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Upload Section */}
                <section className="xl:col-span-2 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/50 dark:border-slate-700/50 p-8 flex flex-col gap-7 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 tracking-tight z-10">
                        <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 shadow-sm inline-flex">
                            📄
                        </span>
                        Configure Analysis
                    </h3>

                    {/* Dropzone */}
                    <div
                        className={`relative z-10 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group ${dragOver
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 scale-[1.02] shadow-inner'
                            : pdfFile
                                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 shadow-inner'
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                        {pdfFile ? (
                            <div className="flex flex-col items-center gap-3 animate-fade-in-up">
                                <span className="text-5xl drop-shadow-sm group-hover:scale-110 transition-transform">✅</span>
                                <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400 break-words">{pdfFile.name}</span>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">Click to replace document</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-3xl mb-2 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 transition-all duration-300">
                                    ☁️
                                </div>
                                <span className="font-bold text-lg text-slate-700 dark:text-slate-200">Drag & drop your Policy PDF</span>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">or click to browse from device (max 10MB)</span>
                            </div>
                        )}
                    </div>

                    {/* URL Input */}
                    <div className="flex flex-col gap-3 z-10">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span>🔗</span> Dataset URL
                        </label>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                            <input
                                type="url"
                                className="relative w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-5 py-4 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0 transition-all shadow-sm font-medium"
                                placeholder="https://example.com/dataset.csv"
                                value={datasetUrl}
                                onChange={(e) => setDatasetUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="z-10 animate-fade-in-up flex items-start gap-3 p-4 rounded-xl bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 text-sm font-medium shadow-sm backdrop-blur-md">
                            <span className="text-lg mt-0.5">⚠️</span> <p className="leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-auto z-10">
                        <button
                            className={`flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded-xl font-bold text-white transition-all duration-300 ${loading
                                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1 active:scale-[0.98]'
                                }`}
                            onClick={handleAnalyze}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing Agent Logs...
                                </>
                            ) : (
                                <>
                                    <span className="text-lg">🔍</span>
                                    <span className="tracking-wide">Run Analysis</span>
                                </>
                            )}
                        </button>

                        {/* Re-run button */}
                        {lastRunUrl && (
                            <button
                                className="sm:w-auto w-full flex items-center justify-center gap-3 py-4 px-8 rounded-xl font-bold bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                                onClick={handleReRun}
                                disabled={loading || !pdfFile}
                                title={!pdfFile ? "Please select a PDF to re-run" : "Run again with the same dataset URL"}
                            >
                                <span className="text-lg">↺</span>
                                <span className="tracking-wide">Re-run Last</span>
                            </button>
                        )}
                    </div>
                </section>

                {/* Mini History Sidebar */}
                <section className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/50 dark:border-slate-700/50 p-6 xl:p-8 flex flex-col h-[600px] xl:h-[auto] xl:min-h-[500px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 tracking-tight">
                            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30 shadow-sm inline-flex">
                                🕒
                            </span>
                            History Log
                        </h3>
                        <button onClick={fetchHistory} disabled={historyLoading} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors shadow-sm active:scale-95">
                            <svg className={`w-5 h-5 ${historyLoading ? 'animate-spin text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                    </div>

                    {/* Trend indicator inside history panel */}
                    {trend && history.length >= 2 && (
                        <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm backdrop-blur-sm border ${trend.color}`}>
                            <span className="font-bold flex items-center gap-2 opacity-80 uppercase tracking-widest text-[11px]">
                                <span>📈</span> Weekly Trend
                            </span>
                            <span className="font-extrabold flex items-center gap-1.5 text-base">
                                {trend.direction === 'up' && <span className="text-lg">↑</span>}
                                {trend.direction === 'down' && <span className="text-lg">↓</span>}
                                {trend.direction === 'flat' && <span className="text-lg">−</span>}
                                {trend.value > 0 ? `${trend.value} ${trend.label}` : trend.label}
                            </span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
                        {historyLoading && history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-sm font-medium text-slate-400 gap-3">
                                <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading history...
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-sm font-medium text-slate-400 gap-3">
                                <span className="text-4xl opacity-50">🧭</span>
                                No history found.<br />Run an analysis to get started.
                            </div>
                        ) : (
                            history.map((r) => (
                                <div key={r.report_id} className="relative group p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-blue-500/5">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200/50 dark:bg-slate-700/50 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 rounded-l-2xl transition-colors duration-300"></div>
                                    <div className="pl-3">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-tight text-ellipsis overflow-hidden whitespace-nowrap pr-2">Report #{r.report_id.slice(0, 8)}</span>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-xs font-bold">
                                            <span className={`px-2.5 py-1.5 rounded-lg border shadow-sm ${r.violations_found > 0
                                                ? 'bg-rose-50/80 border-rose-200/50 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400'
                                                : 'bg-emerald-50/80 border-emerald-200/50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'
                                                }`}>
                                                {r.violations_found > 0 ? '⚠️' : '🛡️'} {r.violations_found}
                                            </span>
                                            <span className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-300 shadow-sm flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-default">
                                                <span className="text-yellow-500/80 drop-shadow-sm">★</span> {r.compliance_score ?? '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* RESULTS SECTION */}
            {summary && (
                <div className="flex flex-col gap-10 animate-fade-in-up mt-4 pb-12 w-full">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-2" />
                    <SummaryCards summary={summary} />
                    <ViolationsTable violations={violations} />
                </div>
            )}
        </div>
    )
}
