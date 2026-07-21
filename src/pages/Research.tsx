import { BookOpen, Microscope, Shield, Lock, Activity } from 'lucide-react'

const researchSections = [
  {
    title: 'Google Fit API',
    icon: Activity,
    content: `Google Fit provides a REST API and Android SDK for accessing fitness data.
- Uses OAuth 2.0 for authentication
- Data types: Heart Rate, Steps, Sleep, Weight, Nutrition
- Requires Google Cloud Platform project
- Android: Health Connect for newer devices`
  },
  {
    title: 'Apple HealthKit',
    icon: Shield,
    content: `HealthKit is Apple's framework for health and fitness data.
- iOS-only framework
- Data types: Heart Rate, Blood Oxygen, ECG, Sleep, Steps
- Requires explicit user permission per data type
- Strong privacy protections
- WatchOS integration for continuous monitoring`
  },
  {
    title: 'rPPG Technology',
    icon: Microscope,
    content: `Remote Photoplethysmography (rPPG) measures blood volume changes via camera.
- Works by detecting subtle color changes in skin
- Best for heart rate measurement
- Requires good lighting and minimal movement
- Research shows 90-95% accuracy in controlled conditions
- Consumer implementations vary widely in quality`
  },
  {
    title: 'Medical Limitations',
    icon: BookOpen,
    content: `Important medical considerations:
- Camera-based vitals are NOT medical devices
- No FDA clearance for camera-based BP/SpO2
- Consumer wearables have varying accuracy
- Always refer to professional medical devices
- This is for wellness tracking only`
  },
  {
    title: 'Privacy Considerations',
    icon: Lock,
    content: `Health data privacy is critical:
- HIPAA compliance for US healthcare
- GDPR for EU users
- Encrypt data in transit and at rest
- Provide clear data deletion options
- Never sell health data
- Audit all data access`
  },
  {
    title: 'Expected Accuracy',
    icon: Activity,
    content: `Real-world accuracy expectations:
- Manual entry: 95-100% (user dependent)
- Wearables (HR): 90-95%
- Wearables (Steps): 85-90%
- Camera (HR): 80-90% (ideal conditions)
- Camera (BP/SpO2): NOT RELIABLE - DO NOT IMPLEMENT`
  }
]

export default function Research() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Research Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">Technical research and findings</p>
      </div>

      <div className="space-y-4">
        {researchSections.map((section, index) => {
          const Icon = section.icon
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex-shrink-0">
                  <Icon className="text-primary-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{section.title}</h3>
                  <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">Final Recommendation</h3>
        <div className="text-green-700 dark:text-green-300 space-y-4">
          <p><strong>Primary Strategy:</strong> Focus on wearable integration first - it provides the best user experience while maintaining good accuracy.</p>
          <p><strong>Mandatory Backup:</strong> Manual entry must always be available as the reliable fallback option.</p>
          <p><strong>Camera:</strong> Only implement heart rate as an experimental feature, clearly labeled as not for medical use.</p>
          <p><strong>Do Not Attempt:</strong> Camera-based blood pressure, SpO2, glucose, or temperature - current technology is not reliable enough.</p>
        </div>
      </div>
    </div>
  )
}
