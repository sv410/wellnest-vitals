import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Check, X, AlertTriangle, Star, Trophy } from 'lucide-react'

const comparisonData = [
  { method: 'Manual Entry', easeOfUse: 4, accuracy: 9, cost: 10, setup: 10, reliability: 9 },
  { method: 'Wearables', easeOfUse: 9, accuracy: 8, cost: 3, setup: 5, reliability: 8 },
  { method: 'Camera (Experimental)', easeOfUse: 6, accuracy: 5, cost: 10, setup: 6, reliability: 4 },
]

const recommendations = [
  {
    category: 'Primary Recommendation',
    method: 'Wearables',
    reason: 'Best balance of ease of use and accuracy. Low friction for users.',
    icon: Trophy,
    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
  },
  {
    category: 'Fallback',
    method: 'Manual Entry',
    reason: 'Most reliable and accurate. Always available when wearables are not.',
    icon: Check,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
  },
  {
    category: 'Experimental',
    method: 'Camera-based',
    reason: 'Only for heart rate. Not for medical use. Good for quick estimates.',
    icon: AlertTriangle,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
  }
]

const vitalsRecommendation = [
  { vital: 'Heart Rate', manual: true, wearable: true, camera: true, cameraOnly: true },
  { vital: 'Blood Pressure', manual: true, wearable: true, camera: false, cameraOnly: false },
  { vital: 'Blood Oxygen', manual: true, wearable: true, camera: false, cameraOnly: false },
  { vital: 'Blood Glucose', manual: true, wearable: false, camera: false, cameraOnly: false },
  { vital: 'Temperature', manual: true, wearable: false, camera: false, cameraOnly: false },
  { vital: 'Weight', manual: true, wearable: true, camera: false, cameraOnly: false },
  { vital: 'Sleep', manual: true, wearable: true, camera: false, cameraOnly: false },
  { vital: 'Steps', manual: true, wearable: true, camera: false, cameraOnly: false },
]

export default function Comparison() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Strategy Comparison</h1>
        <p className="text-gray-600 dark:text-gray-400">Compare the three vitals collection methods</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {recommendations.map(rec => {
          const Icon = rec.icon
          return (
            <div key={rec.method} className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border ${rec.color.split(' ')[1].replace('bg-', 'border-').replace('/20', '/30')}`}>
              <div className={`w-12 h-12 rounded-xl ${rec.color} flex items-center justify-center mb-4`}>
                <Icon size={24} className={rec.color.split(' ')[0]} />
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{rec.category}</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">{rec.method}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{rec.reason}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Radar Comparison</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={comparisonData}>
              <PolarGrid stroke="#e5e7eb" dark:stroke="#374151" />
              <PolarAngleAxis dataKey="method" stroke="#6b7280" />
              <PolarRadiusAxis stroke="#6b7280" />
              <Radar name="Ease of Use" dataKey="easeOfUse" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
              <Radar name="Accuracy" dataKey="accuracy" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Radar name="Reliability" dataKey="reliability" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Detailed Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Ease of Use</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Accuracy</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Cost</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Setup</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map(item => (
                <tr key={item.method} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{item.method}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < item.easeOfUse ? '#fbbf24' : 'none'} 
                            className={i < item.easeOfUse ? 'text-yellow-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{item.easeOfUse}/10</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < item.accuracy ? '#10b981' : 'none'} 
                            className={i < item.accuracy ? 'text-green-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{item.accuracy}/10</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < item.cost ? '#0ea5e9' : 'none'} 
                            className={i < item.cost ? 'text-primary-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{item.cost}/10</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < item.setup ? '#8b5cf6' : 'none'} 
                            className={i < item.setup ? 'text-purple-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{item.setup}/10</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < item.reliability ? '#f59e0b' : 'none'} 
                            className={i < item.reliability ? 'text-orange-400' : 'text-gray-300'} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{item.reliability}/10</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Vitals Support Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Vital</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Manual</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Wearable</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Camera</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Notes</th>
              </tr>
            </thead>
            <tbody>
              {vitalsRecommendation.map(item => (
                <tr key={item.vital} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{item.vital}</td>
                  <td className="py-4 px-4 text-center">
                    {item.manual ? <Check className="inline text-green-500" /> : <X className="inline text-gray-300" />}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {item.wearable ? <Check className="inline text-green-500" /> : <X className="inline text-gray-300" />}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {item.camera ? (
                      <span className="inline-flex items-center gap-1 text-purple-600">
                        <AlertTriangle size={16} />
                        <span className="text-xs">Experimental</span>
                      </span>
                    ) : (
                      <X className="inline text-gray-300" />
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {!item.cameraOnly && item.camera === false ? 'Camera not reliable - use manual or wearable' : ''}
                    {item.cameraOnly ? 'Only heart rate via camera is supported' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
