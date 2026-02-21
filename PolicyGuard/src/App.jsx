import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PolicyDocuments from './components/PolicyDocuments'

function getUserId() {
  let id = localStorage.getItem('pg_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('pg_user_id', id)
  }
  return id
}

export default function App() {
  const userId = getUserId()

  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pg_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('pg_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('pg_theme', 'light')
    }
  }, [darkMode])

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'policies'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${darkMode
        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-gray-100'
        : 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 text-slate-900'
      }`}>

      {/* Decorative background blobs for a modern look */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-60 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      <Sidebar
        userId={userId}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10">

        {/* MOBILE HEADER */}
        <header className="lg:hidden h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 flex items-center px-4 justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white text-sm" role="img" aria-label="shield">🛡️</span>
              </div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                PolicyGuard
              </h1>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar scroll-smooth">

          <div className={activeTab === 'dashboard' ? 'block animate-fade-in-up' : 'hidden'}>
            <Dashboard userId={userId} />
          </div>

          <div className={activeTab === 'policies' ? 'block animate-fade-in-up' : 'hidden'}>
            <PolicyDocuments setActiveTab={setActiveTab} />
          </div>

        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background-color: rgba(148, 163, 184, 0.3); 
          border-radius: 20px; 
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.5); 
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { 
          background-color: rgba(71, 85, 105, 0.4); 
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background-color: rgba(71, 85, 105, 0.7); 
        }
      `}} />
    </div>
  )
}
