import { useState } from 'react'
import { useAppContext } from '../App'
import { VITAL_CONFIGS, VitalType } from '../types'
import { 
  Save, 
  X, 
  Clock,
  Plus,
  Trash2
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

export default function EntryForm() {
  const { addEntry, entries, deleteEntry, updateEntry } = useAppContext()
  const [selectedVital, setSelectedVital] = useState<VitalType>('heartRate')
  const [value, setValue] = useState('')
  const [value2, setValue2] = useState('')
  const [notes, setNotes] = useState('')

  const config = VITAL_CONFIGS[selectedVital]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedVital === 'bloodPressure') {
      addEntry({
        type: selectedVital,
        value: { systolic: parseInt(value), diastolic: parseInt(value2) },
        source: 'manual',
        notes: notes || undefined
      })
    } else {
      addEntry({
        type: selectedVital,
        value: parseFloat(value),
        source: 'manual',
        notes: notes || undefined
      })
    }

    setValue('')
    setValue2('')
    setNotes('')
  }

  const recentEntries = entries
    .filter(e => e.type === selectedVital)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manual Entry</h1>
        <p className="text-gray-600 dark:text-gray-400">Record your vitals manually</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(VITAL_CONFIGS).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => {
              setSelectedVital(type as VitalType)
              setValue('')
              setValue2('')
            }}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-center",
              selectedVital === type
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            )}
          >
            <span className="font-medium text-sm">{cfg.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{config.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-gray-500">Normal Range:</span>
            <span className="font-medium text-blue-600">
              {config.normalRange[0]} - {config.normalRange[1]} {config.unit}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedVital === 'bloodPressure' ? 'Systolic' : 'Value'} ({config.unit})
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter value"
                required
              />
            </div>
            
            {selectedVital === 'bloodPressure' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Diastolic ({config.unit})
                </label>
                <input
                  type="number"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter value"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
              placeholder="Add any notes..."
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            <Save size={20} />
            Save Entry
          </button>
        </form>
      </div>

      {recentEntries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Entries</h3>
          <div className="space-y-3">
            {recentEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {typeof entry.value === 'number' 
                      ? `${entry.value} ${config.unit}`
                      : `${entry.value.systolic}/${entry.value.diastolic} ${config.unit}`}
                  </p>
                  <p className="text-sm text-gray-500">
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
        </div>
      )}
    </div>
  )
}
