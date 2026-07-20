import { useAppContext } from '../App'
import { VITAL_CONFIGS, VitalType } from '../types'
import { 
  Activity, 
  Heart, 
  Droplets, 
  Wind, 
  Thermometer, 
  Scale, 
  Ruler, 
  FlaskConical, 
  Moon, 
  Footprints, 
  Droplet,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

const icons = {
  activity: Activity,
  heart: Heart,
  droplets: Droplets,
  wind: Wind,
  thermometer: Thermometer,
  scale: Scale,
  ruler: Ruler,
  'flask-conical': FlaskConical,
  moon: Moon,
  footprints: Footprints,
  droplet: Droplet
}

export default function Dashboard() {
  const { entries, getLatestEntry, getEntriesByType } = useAppContext()

  const downloadJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `wellnest-vitals-${new Date().toISOString().split('T')[0]}.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const viewJSON = () => {
    alert('Check browser console (F12) for formatted JSON!')
    console.log('📋 WellNest Vitals Data (JSON):')
    console.log(JSON.stringify(entries, null, 2))
  }

  const getStatus = (type: VitalType, value: number) => {
    const config = VITAL_CONFIGS[type]
    if (value < config.normalRange[0]) return { label: 'Low', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' }
    if (value > config.normalRange[1]) return { label: 'High', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' }
    return { label: 'Normal', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' }
  }

  const getTrend = (type: VitalType) => {
    const entries = getEntriesByType(type)
    if (entries.length < 2) return null
    const latest = typeof entries[0].value === 'number' ? entries[0].value : entries[0].value.systolic
    const previous = typeof entries[1].value === 'number' ? entries[1].value : entries[1].value.systolic
    if (latest > previous) return 'up'
    if (latest < previous) return 'down'
    return 'stable'
  }

  const calculateBMI = () => {
    const weightEntry = getLatestEntry('weight')
    const heightEntry = getLatestEntry('height')
    if (!weightEntry || !heightEntry) return null
    const weight = typeof weightEntry.value === 'number' ? weightEntry.value : 0
    const height = typeof heightEntry.value === 'number' ? heightEntry.value : 0
    if (weight === 0 || height === 0) return null
    const bmi = (weight / (height * height)) * 703
    return Math.round(bmi * 10) / 10
  }

  const bmi = calculateBMI()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Health Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your vital signs</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={viewJSON}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl transition-colors"
            >
              <Eye size={20} />
              View JSON
            </button>
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              <Download size={20} />
              Download JSON
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(VITAL_CONFIGS).map(([type, config]) => {
          const entry = getLatestEntry(type as VitalType)
          const Icon = icons[config.icon as keyof typeof icons]
          const trend = getTrend(type as VitalType)
          
          let displayValue = '--'
          let status = { label: 'No Data', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' }
          
          if (entry) {
            if (type === 'bloodPressure' && typeof entry.value !== 'number') {
              displayValue = `${entry.value.systolic}/${entry.value.diastolic}`
              status = getStatus('bloodPressure', entry.value.systolic)
            } else if (typeof entry.value === 'number') {
              displayValue = `${entry.value}${config.unit}`
              status = getStatus(type as VitalType, entry.value)
            }
          }

          return (
            <div key={type} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl bg-opacity-10", config.color.replace('text-', 'bg-'))}>
                  <Icon className={config.color} size={24} />
                </div>
                <div className="flex items-center gap-2">
                  {trend === 'up' && <TrendingUp size={16} className="text-red-500" />}
                  {trend === 'down' && <TrendingDown size={16} className="text-green-500" />}
                  {trend === 'stable' && <Minus size={16} className="text-gray-400" />}
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{config.name}</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{displayValue}</p>
              
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full", status.color)}>
                  {status.label}
                </span>
                {entry && (
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {bmi && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/20">
                <Activity className="text-violet-500" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">BMI</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{bmi}</p>
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                bmi < 18.5 ? "text-amber-600 bg-amber-50" :
                bmi < 25 ? "text-green-600 bg-green-50" :
                "text-red-600 bg-red-50"
              )}>
                {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
            <Activity className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
          <div>
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Medical Disclaimer</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This application is for wellness purposes only and is not a diagnostic tool. 
              Always consult with a healthcare professional for medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
