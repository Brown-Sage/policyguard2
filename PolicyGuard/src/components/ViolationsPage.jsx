import { useState, useEffect } from 'react'
import ViolationsTable from './ViolationsTable'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function ViolationsPage() {
    const [violations, setViolations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchViolations = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${BASE_URL}/violations/`)
            if (!res.ok) throw new Error('Failed to fetch violations')
            const data = await res.json()
            setViolations(data)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchViolations()
    }, [])

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">All Violations</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">Global view of all policy violations across the organization.</p>
                </div>
                <button
                    onClick={fetchViolations}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50"
                >
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh Data
                </button>
            </div>

            {error && (
                <div className="animate-fade-in-up flex items-start gap-3 p-4 rounded-xl bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 text-sm font-medium shadow-sm backdrop-blur-md">
                    <span className="text-lg mt-0.5">⚠️</span> <p className="leading-relaxed">{error}</p>
                </div>
            )}

            <div className="animate-fade-in-up">
                {loading && violations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-slate-500 shrink-0">
                        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-medium text-lg">Fetching system violations...</p>
                    </div>
                ) : (
                    <ViolationsTable violations={violations} />
                )}
            </div>
        </div>
    )
}
