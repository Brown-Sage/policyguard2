import { useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function AuthPage({ onAuth }) {
    const [mode, setMode] = useState('login') // 'login' | 'signup'

    return (
        <div className="min-h-screen flex items-center justify-center p-4
            bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]
            from-slate-900 via-[#0f172a] to-black">

            {/* Background blobs */}
            <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                        bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-2xl shadow-blue-500/40 mb-4">
                        <span className="text-3xl">🛡️</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">PolicyGuard</h1>
                    <p className="text-slate-400 mt-1 text-sm font-medium">Compliance monitoring, simplified.</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
                    {/* Tab switcher */}
                    <div className="flex bg-white/5 rounded-2xl p-1 mb-8 border border-white/10">
                        {['login', 'signup'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setMode(tab)}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${mode === tab
                                        ? 'bg-white text-slate-900 shadow-md'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {tab === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        ))}
                    </div>

                    {mode === 'login'
                        ? <LoginForm onAuth={onAuth} switchMode={() => setMode('signup')} />
                        : <SignupForm onAuth={onAuth} switchMode={() => setMode('login')} />
                    }
                </div>
            </div>
        </div>
    )
}

/* ────────────────────────────────────────── */
function LoginForm({ onAuth, switchMode }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Login failed.')
            localStorage.setItem('pg_token', data.access_token)
            localStorage.setItem('pg_username', data.username)
            onAuth(data.username)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm
                    bg-gradient-to-r from-blue-600 to-indigo-600
                    hover:from-blue-500 hover:to-indigo-500
                    hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5
                    active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
                {loading ? 'Signing in…' : 'Sign In →'}
            </button>

            <p className="text-center text-sm text-slate-400">
                No account?{' '}
                <button type="button" onClick={switchMode}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Create one
                </button>
            </p>
        </form>
    )
}

/* ────────────────────────────────────────── */
function SignupForm({ onAuth, switchMode }) {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        if (password !== confirm) { setError('Passwords do not match.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Registration failed.')
            localStorage.setItem('pg_token', data.access_token)
            localStorage.setItem('pg_username', data.username)
            onAuth(data.username)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
            <Field label="Username" type="text" value={username} onChange={setUsername} placeholder="john_doe" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" />

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm
                    bg-gradient-to-r from-indigo-600 to-purple-600
                    hover:from-indigo-500 hover:to-purple-500
                    hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5
                    active:scale-[0.98] transition-all duration-200 disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create Account →'}
            </button>

            <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <button type="button" onClick={switchMode}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Sign in
                </button>
            </p>
        </form>
    )
}

/* ────────────────────────────────────────── */
function Field({ label, type, value, onChange, placeholder }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                    text-white placeholder-slate-600 text-sm font-medium
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                    transition-all duration-200 hover:border-white/20"
            />
        </div>
    )
}

function ErrorBanner({ message }) {
    return (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
            <span className="mt-0.5">⚠️</span>
            <span>{message}</span>
        </div>
    )
}
