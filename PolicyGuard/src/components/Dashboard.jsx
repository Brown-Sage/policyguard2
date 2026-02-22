import { useState, useRef, useEffect } from 'react'
import SummaryCards from './SummaryCards'
import ViolationsTable from './ViolationsTable'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function Dashboard({ userId }) {

    // Form states
    const [pdfFile, setPdfFile] = useState(null)
    const [csvFile, setCsvFile] = useState(null)

    // Request states
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Data states
    const [summary, setSummary] = useState(null)
    const [violations, setViolations] = useState([])
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [selectedLog, setSelectedLog] = useState(null)

    // UI state
    const [dragOverPdf, setDragOverPdf] = useState(false)
    const [dragOverCsv, setDragOverCsv] = useState(false)
    const pdfRef = useRef()
    const csvRef = useRef()

    // Fetch scan logs from the API (persists across refreshes)
    async function fetchLogs() {
        setHistoryLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/scan/logs`)
            if (res.ok) setHistory(await res.json())
        } catch { /* ignore */ } finally {
            setHistoryLoading(false)
        }
    }

    useEffect(() => { fetchLogs() }, [])

    async function runAnalysis() {
        if (!pdfFile) { setError('Please select a Policy PDF file.'); return }
        if (!csvFile) { setError('Please select an Employee Dataset CSV file.'); return }

        setError('')
        setLoading(true)
        setSummary(null)
        setViolations([])

        try {
            // 0. Reset Backend State for Isolated Scan
            const resetRes = await fetch(`${BASE_URL}/scan/reset`, { method: 'POST' })
            if (!resetRes.ok) throw new Error('Failed to isolate scan environment.')

            // 1. Upload Policy PDF
            const policyFormData = new FormData()
            policyFormData.append('file', pdfFile)
            const policyRes = await fetch(`${BASE_URL}/policies/upload`, {
                method: 'POST',
                body: policyFormData,
            })
            if (!policyRes.ok) throw new Error(`Policy upload failed: ${await policyRes.text()}`)
            const policyData = await policyRes.json()

            // 2. Upload Employee Dataset CSV
            const csvFormData = new FormData()
            csvFormData.append('file', csvFile)
            const csvRes = await fetch(`${BASE_URL}/employees/batch`, {
                method: 'POST',
                body: csvFormData,
            })
            if (!csvRes.ok) throw new Error(`Dataset format invalid: ${await csvRes.text()}`)
            const csvData = await csvRes.json()

            // 3. Trigger Scan
            const scanRes = await fetch(`${BASE_URL}/scan/trigger`, { method: 'POST' })
            if (!scanRes.ok) throw new Error(`Scan failed: ${await scanRes.text()}`)
            const scanData = await scanRes.json()

            // 4. Build Summary
            const totalViolations = scanData.length
            setViolations(scanData)
            const newSummary = {
                compliance_score: Math.max(0, 100 - (totalViolations * 5)),
                total_records: csvData.imported_count || csvData.records_imported || 0,
                total_rules: policyData.rules?.length || 0,
                violations_found: totalViolations
            }
            setSummary(newSummary)

            // Refresh logs from API so new entry appears immediately
            await fetchLogs()
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function handlePdfDrop(e) {
        e.preventDefault()
        setDragOverPdf(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type === 'application/pdf') {
            setPdfFile(file); setError('')
        } else {
            setError('Only PDF files are accepted for policies.')
        }
    }

    function handleCsvDrop(e) {
        e.preventDefault()
        setDragOverCsv(false)
        const file = e.dataTransfer.files[0]
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            setCsvFile(file); setError('')
        } else {
            setError('Only CSV files are accepted for datasets.')
        }
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10">
                        {/* PDF Dropzone */}
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${dragOverPdf
                                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 scale-[1.02] shadow-inner'
                                : pdfFile
                                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 shadow-inner'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverPdf(true) }}
                            onDragLeave={() => setDragOverPdf(false)}
                            onDrop={handlePdfDrop}
                            onClick={() => pdfRef.current?.click()}
                        >
                            <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) { setPdfFile(file); setError('') }
                            }} />
                            {pdfFile ? (
                                <div className="flex flex-col items-center gap-3 animate-fade-in-up">
                                    <span className="text-4xl drop-shadow-sm group-hover:scale-110 transition-transform">✅</span>
                                    <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 break-words line-clamp-2">{pdfFile.name}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">PDF Loaded</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl mb-1 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/50 transition-all duration-300">
                                        📜
                                    </div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Policy PDF</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Drag & drop or browse</span>
                                </div>
                            )}
                        </div>

                        {/* CSV Dropzone */}
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group ${dragOverCsv
                                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 scale-[1.02] shadow-inner'
                                : csvFile
                                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 shadow-inner'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverCsv(true) }}
                            onDragLeave={() => setDragOverCsv(false)}
                            onDrop={handleCsvDrop}
                            onClick={() => csvRef.current?.click()}
                        >
                            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) { setCsvFile(file); setError('') }
                            }} />
                            {csvFile ? (
                                <div className="flex flex-col items-center gap-3 animate-fade-in-up">
                                    <span className="text-4xl drop-shadow-sm group-hover:scale-110 transition-transform">✅</span>
                                    <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 break-words line-clamp-2">{csvFile.name}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">CSV Loaded</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mb-1 group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/50 transition-all duration-300">
                                        📊
                                    </div>
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Dataset CSV</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Drag & drop or browse</span>
                                </div>
                            )}
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
                            onClick={runAnalysis}
                            disabled={loading || !pdfFile || !csvFile}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing API Calls...
                                </>
                            ) : (
                                <>
                                    <span className="text-lg">🔍</span>
                                    <span className="tracking-wide">Run Full Analysis</span>
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {/* Scan Log History Panel */}
                <section className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/50 dark:border-slate-700/50 p-6 xl:p-8 flex flex-col h-[600px] xl:h-[auto] xl:min-h-[500px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100 tracking-tight">
                            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30 shadow-sm inline-flex">🕒</span>
                            Scan History
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">click to expand</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {historyLoading && history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-sm font-medium text-slate-400 gap-3">
                                <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Loading history...
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-sm font-medium text-slate-400 gap-3">
                                <span className="text-4xl opacity-50">🧭</span>
                                No scans yet.<br />Run an analysis to get started.
                            </div>
                        ) : (
                            history.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedLog(r)}
                                    className="w-full text-left relative group p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200/50 dark:bg-slate-700/50 group-hover:bg-blue-500 rounded-l-2xl transition-colors duration-200" />
                                    <div className="pl-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-extrabold text-slate-700 dark:text-slate-200 text-sm tracking-tight">Scan #{r.scan_id}</span>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-md shrink-0">{r.scanned_at}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">📄 {r.policy_filename}</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shadow-sm ${r.violation_count > 0
                                                ? 'bg-rose-50/80 border-rose-200/50 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400'
                                                : 'bg-emerald-50/80 border-emerald-200/50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'
                                            }`}>
                                            {r.violation_count > 0 ? '⚠️' : '🛡️'} {r.violation_count} Violations
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                {/* Log Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Scan #{selectedLog.scan_id}</h3>
                                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none">&times;</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                                    <span className="text-2xl">📄</span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Policy Document</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedLog.policy_filename}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Dataset</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedLog.dataset_filename}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-center">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Employees</p>
                                        <p className="text-2xl font-extrabold text-slate-700 dark:text-white">{selectedLog.employee_count}</p>
                                    </div>
                                    <div className={`p-4 rounded-2xl border text-center ${selectedLog.violation_count > 0
                                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200/50 dark:border-rose-800/50'
                                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50'
                                        }`}>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Violations</p>
                                        <p className={`text-2xl font-extrabold ${selectedLog.violation_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                            }`}>{selectedLog.violation_count}</p>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-400">{selectedLog.scanned_at_full ? new Date(selectedLog.scanned_at_full).toLocaleString() : ''}</p>
                            </div>
                        </div>
                    </div>
                )}
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
