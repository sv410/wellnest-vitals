import { useState } from 'react'
import { useAppContext } from '../App'
import { VITAL_CONFIGS, VitalType } from '../types'
import { 
  Search, 
  Filter, 
  Calendar,
  Trash2,
  Edit2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function History() {
  const { entries, deleteEntry } = useAppContext()
  const [selectedVital, setSelectedVital] = useState<VitalType>('heartRate')
  const [search, setSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const filteredEntries = entries
    .filter(e => e.type === selectedVital)
    .filter(e => {
      if (timeFilter === 'all') return true
      const now = Date.now()
      const entryDate = e.timestamp
      if (timeFilter === 'today') return now - entryDate < 24 * 60 * 60 * 1000
      if (timeFilter === 'week') return now - entryDate < 7 * 24 * 60 * 60 * 1000
      if (timeFilter === 'month') return now - entryDate < 30 * 24 * 60 * 60 * 1000
      return true
    })
    .sort((a, b) => b.timestamp - a.timestamp)

  const chartData = filteredEntries
    .slice()
    .reverse()
    .map(entry => ({
      date: new Date(entry.timestamp).toLocaleDateString(),
      value: typeof entry.value === 'number' ? entry.value : entry.value.systolic
    }))

  const config = VITAL_CONFIGS[selectedVital]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">History</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage your vitals history</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(VITAL_CONFIGS).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => setSelectedVital(type as VitalType)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedVital === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cfg.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'today', 'week', 'month'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === filter
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark:stroke="#374151" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Entries</h3>
        </div>
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
            <p className="text-gray-500">No entries yet for {config.name}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {typeof entry.value === 'number' 
                        ? `${entry.value} ${config.unit}`
                        : `${entry.value.systolic}/${entry.value.diastolic} ${config.unit}`}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      entry.source === 'manual' ? 'bg-gray-100 text-gray-700' :
                      entry.source === 'camera' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {entry.source}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
