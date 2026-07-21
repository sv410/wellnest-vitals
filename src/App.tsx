import { useState, createContext, useContext, useEffect } from 'react'
import { VitalEntry, VitalType, VITAL_CONFIGS } from './types'
import Dashboard from './pages/Dashboard'
import EntryForm from './pages/EntryForm'
import History from './pages/History'
import Comparison from './pages/Comparison'
import CameraMeasure from './pages/CameraMeasure'
import Wearables from './pages/Wearables'
import Research from './pages/Research'
import { 
  Activity, 
  Calendar, 
  BarChart, 
  Camera, 
  Watch, 
  BookOpen,
  Menu,
  X,
  Home,
  Plus,
  Smartphone,
  Monitor,
  Moon,
  Sun
} from 'lucide-react'

const STORAGE_KEY = 'wellnest_entries'

interface AppContextType {
  entries: VitalEntry[]
  addEntry: (entry: Omit<VitalEntry, 'id' | 'timestamp'>) => void
  updateEntry: (id: string, entry: Partial<VitalEntry>) => void
  deleteEntry: (id: string) => void
  getLatestEntry: (type: VitalType) => VitalEntry | undefined
  getEntriesByType: (type: VitalType) => VitalEntry[]
  darkMode: boolean
  toggleDarkMode: () => void
  viewMode: 'mobile' | 'desktop'
  setViewMode: (mode: 'mobile' | 'desktop') => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used within AppProvider')
  return context
}

export default function App() {
  const [entries, setEntries] = useState<VitalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return []
    }
  })
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('darkMode') === 'true'
    } catch (e) {
      return false
    }
  })
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'history' | 'camera' | 'wearables' | 'comparison' | 'research'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [entries])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('darkMode', String(darkMode))
    } catch (e) {
      console.error('Failed to save darkMode to localStorage:', e)
    }
  }, [darkMode])

  const addEntry = (entry: Omit<VitalEntry, 'id' | 'timestamp'>) => {
    const newEntry: VitalEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    setEntries(prev => [...prev, newEntry])
  }

  const updateEntry = (id: string, updates: Partial<VitalEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const getLatestEntry = (type: VitalType) => {
    const typeEntries = entries.filter(e => e.type === type).sort((a, b) => b.timestamp - a.timestamp)
    return typeEntries[0]
  }

  const getEntriesByType = (type: VitalType) => {
    return entries.filter(e => e.type === type).sort((a, b) => b.timestamp - a.timestamp)
  }



  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'entry', label: 'Manual Entry', icon: Plus },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'wearables', label: 'Wearables', icon: Watch },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'comparison', label: 'Comparison', icon: BarChart },
    { id: 'research', label: 'Research', icon: BookOpen },
  ]

  return (
    <AppContext.Provider value={{
      entries,
      addEntry,
      updateEntry,
      deleteEntry,
      getLatestEntry,
      getEntriesByType,
      darkMode,
      toggleDarkMode: () => setDarkMode(!darkMode),
      viewMode,
      setViewMode
    }}>
      <div className={`min-h-screen transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-md mx-auto shadow-2xl' : ''}`}>
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-2">
                <Activity className="text-blue-500" size={28} />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  WellNest
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                >
                  <Smartphone size={20} />
                </button>
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                >
                  <Monitor size={20} />
                </button>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>

        <div className="flex">
          <aside className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-20 transition-transform duration-300
            lg:translate-x-0 lg:static
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <nav className="p-4 space-y-2">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any)
                      setSidebarOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isActive 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          <main className="flex-1 p-4 lg:p-8 bg-gray-50 dark:bg-gray-900">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'entry' && <EntryForm />}
            {activeTab === 'history' && <History />}
            {activeTab === 'wearables' && <Wearables />}
            {activeTab === 'camera' && <CameraMeasure />}
            {activeTab === 'comparison' && <Comparison />}
            {activeTab === 'research' && <Research />}
          </main>
        </div>

        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </AppContext.Provider>
  )
}
