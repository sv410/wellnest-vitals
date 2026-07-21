import { useMemo, useState } from 'react'
import { useAppContext } from '../App'
import { Watch, Smartphone, CheckCircle, XCircle, RefreshCw, Link2, Heart, Droplets, Activity, Wind, Thermometer, FlaskConical, Footprints } from 'lucide-react'
import { motion } from 'framer-motion'

type WatchPlatform = 'google' | 'apple'

type WatchReading = {
  type: 'heartRate' | 'bloodOxygen' | 'respiratoryRate' | 'temperature' | 'bloodSugar' | 'steps' | 'sleepHours'
  value: number
  source: 'google_fit' | 'apple_health'
  label: string
  unit: string
}

export default function Wearables() {
  const { addEntry, entries } = useAppContext()
  const [googleFitConnected, setGoogleFitConnected] = useState(false)
  const [appleHealthConnected, setAppleHealthConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncSource, setLastSyncSource] = useState<WatchPlatform | null>(null)

  const mockGoogleFitData: WatchReading[] = [
    { type: 'heartRate', value: 73, source: 'google_fit', label: 'Heart Rate', unit: 'bpm' },
    { type: 'bloodOxygen', value: 98, source: 'google_fit', label: 'Blood Oxygen', unit: '%' },
    { type: 'respiratoryRate', value: 15, source: 'google_fit', label: 'Respiratory Rate', unit: 'brpm' },
    { type: 'temperature', value: 98.4, source: 'google_fit', label: 'Temperature', unit: '°F' },
    { type: 'bloodSugar', value: 104, source: 'google_fit', label: 'Blood Sugar', unit: 'mg/dL' },
    { type: 'steps', value: 8542, source: 'google_fit', label: 'Steps', unit: 'steps' },
    { type: 'sleepHours', value: 7.5, source: 'google_fit', label: 'Sleep', unit: 'hrs' },
  ]

  const mockAppleHealthData: WatchReading[] = [
    { type: 'heartRate', value: 72, source: 'apple_health', label: 'Heart Rate', unit: 'bpm' },
    { type: 'bloodOxygen', value: 97, source: 'apple_health', label: 'Blood Oxygen', unit: '%' },
    { type: 'respiratoryRate', value: 14, source: 'apple_health', label: 'Respiratory Rate', unit: 'brpm' },
    { type: 'temperature', value: 98.1, source: 'apple_health', label: 'Temperature', unit: '°F' },
    { type: 'bloodSugar', value: 101, source: 'apple_health', label: 'Blood Sugar', unit: 'mg/dL' },
    { type: 'steps', value: 9234, source: 'apple_health', label: 'Steps', unit: 'steps' },
    { type: 'sleepHours', value: 8, source: 'apple_health', label: 'Sleep', unit: 'hrs' },
  ]

  const recentWatchEntries = useMemo(() => {
    return entries.filter(entry => entry.source === 'google_fit' || entry.source === 'apple_health').slice(-6).reverse()
  }, [entries])

  const handleSync = (platform: WatchPlatform) => {
    setSyncing(true)
    setLastSyncSource(platform)
    setTimeout(() => {
      const data = platform === 'google' ? mockGoogleFitData : mockAppleHealthData
      data.forEach(item => {
        addEntry({
          type: item.type,
          value: item.value,
          source: item.source,
          notes: `${item.label} synced from ${platform === 'google' ? 'Google Fit' : 'Apple Health'} on watch`,
          confidence: 0.9,
        })
      })
      setSyncing(false)
    }, 1200)
  }

  const renderWatchCard = (platform: WatchPlatform, connected: boolean, title: string, subtitle: string, accent: string, icon: JSX.Element) => {
    const isGoogle = platform === 'google'
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-2xl ${accent}`}>{icon}</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          {connected ? (
            <span className="flex items-center gap-2 text-green-600 font-medium text-sm">
              <CheckCircle size={16} /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 text-gray-500 font-medium text-sm">
              <XCircle size={16} /> Disconnected
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['Heart Rate', 'SpO2', 'Resp. Rate', 'Temp', 'Blood Sugar'].map(item => (
            <span key={item} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
              {item}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          {!connected ? (
            <button onClick={() => { if (isGoogle) setGoogleFitConnected(true); else setAppleHealthConnected(true) }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${isGoogle ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900'}`}>
              <Link2 size={16} /> Connect
            </button>
          ) : (
            <>
              <button onClick={() => handleSync(platform)} disabled={syncing} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm">
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> Sync Now
              </button>
              <button onClick={() => { if (isGoogle) setGoogleFitConnected(false); else setAppleHealthConnected(false) }} className="px-4 py-3 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-colors text-sm">
                Disconnect
              </button>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Watch & Wearable Sync</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Prioritize watch-based readings for HR, SpO2, respiratory rate, temperature, and blood sugar, while still allowing manual entry when needed.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderWatchCard('google', googleFitConnected, 'Google Fit', 'Android • Wear OS', 'bg-green-100 dark:bg-green-900/20', <Smartphone className="text-green-600" size={20} />)}
        {renderWatchCard('apple', appleHealthConnected, 'Apple Health', 'iPhone • Apple Watch', 'bg-gray-100 dark:bg-gray-800', <Watch className="text-gray-700 dark:text-gray-300" size={20} />)}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="text-blue-600" size={18} />
          <h4 className="font-semibold text-blue-800 dark:text-blue-200">Watch-first data flow</h4>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">The app now prioritizes wearable data for heart rate, SpO2, respiratory rate, temperature, and blood sugar. You can still add manual entries from the Manual Entry section whenever needed.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Latest Watch Readings</h4>
          {lastSyncSource && <span className="text-xs text-blue-600">Synced from {lastSyncSource === 'google' ? 'Google Fit' : 'Apple Health'}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recentWatchEntries.map(entry => (
            <div key={`${entry.id}-${entry.type}`} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-3">
              <div className="flex items-center gap-2">
                {entry.type === 'heartRate' && <Heart size={16} className="text-rose-500" />}
                {entry.type === 'bloodOxygen' && <Droplets size={16} className="text-blue-500" />}
                {entry.type === 'respiratoryRate' && <Wind size={16} className="text-emerald-500" />}
                {entry.type === 'temperature' && <Thermometer size={16} className="text-orange-500" />}
                {entry.type === 'bloodSugar' && <FlaskConical size={16} className="text-amber-500" />}
                {entry.type === 'steps' && <Footprints size={16} className="text-green-500" />}
                {entry.type === 'sleepHours' && <Watch size={16} className="text-purple-500" />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{entry.notes?.split(' synced from')[0] || entry.type}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{typeof entry.value === 'number' ? `${entry.value}` : entry.value.systolic}/{entry.value.diastolic}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
