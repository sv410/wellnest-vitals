import { useState } from 'react'
import { useAppContext } from '../App'
import { Watch, Smartphone, CheckCircle, XCircle, RefreshCw, Link2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Wearables() {
  const { addEntry } = useAppContext()
  const [googleFitConnected, setGoogleFitConnected] = useState(false)
  const [appleHealthConnected, setAppleHealthConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const mockGoogleFitData = [
    { type: 'heartRate', value: 72, source: 'google_fit' as const },
    { type: 'steps', value: 8542, source: 'google_fit' as const },
    { type: 'sleepHours', value: 7.5, source: 'google_fit' as const },
    { type: 'weight', value: 165, source: 'google_fit' as const },
  ]

  const mockAppleHealthData = [
    { type: 'heartRate', value: 68, source: 'apple_health' as const },
    { type: 'bloodOxygen', value: 98, source: 'apple_health' as const },
    { type: 'steps', value: 9234, source: 'apple_health' as const },
    { type: 'sleepHours', value: 8, source: 'apple_health' as const },
  ]

  const handleSync = (platform: 'google' | 'apple') => {
    setSyncing(true)
    setTimeout(() => {
      const data = platform === 'google' ? mockGoogleFitData : mockAppleHealthData
      data.forEach(item => {
        addEntry(item)
      })
      setSyncing(false)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wearable Integration</h1>
        <p className="text-gray-600 dark:text-gray-400">Connect your wearable devices for automatic sync</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-2xl">
              <Smartphone className="text-green-600" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Google Fit</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Android & Wear OS</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              {googleFitConnected ? (
                <span className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle size={20} />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-2 text-gray-500 font-medium">
                  <XCircle size={20} />
                  Disconnected
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Data to sync:</p>
              <div className="flex flex-wrap gap-2">
                {['Heart Rate', 'Steps', 'Sleep', 'Weight', 'Calories'].map(item => (
                  <span key={item} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {!googleFitConnected ? (
                <button
                  onClick={() => setGoogleFitConnected(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
                >
                  <Link2 size={20} />
                  Connect
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleSync('google')}
                    disabled={syncing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                  >
                    <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                    Sync Now
                  </button>
                  <button
                    onClick={() => setGoogleFitConnected(false)}
                    className="px-4 py-3 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
              <Watch className="text-gray-700 dark:text-gray-300" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Apple Health</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">iOS & Apple Watch</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              {appleHealthConnected ? (
                <span className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle size={20} />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-2 text-gray-500 font-medium">
                  <XCircle size={20} />
                  Disconnected
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Data to sync:</p>
              <div className="flex flex-wrap gap-2">
                {['Heart Rate', 'Blood Oxygen', 'Steps', 'Sleep', 'Activity'].map(item => (
                  <span key={item} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {!appleHealthConnected ? (
                <button
                  onClick={() => setAppleHealthConnected(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  <Link2 size={20} />
                  Connect
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleSync('apple')}
                    disabled={syncing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                  >
                    <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                    Sync Now
                  </button>
                  <button
                    onClick={() => setAppleHealthConnected(false)}
                    className="px-4 py-3 border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Architecture Note</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          This is a mock implementation. In production, you would use:
          <br />• Google Fit API for Android
          <br />• HealthKit for iOS
          <br />• Proper OAuth 2.0 authentication
          <br />• Background sync capabilities
        </p>
      </div>
    </div>
  )
}
