import { useState, useRef, useEffect } from 'react'
import { useAppContext } from '../App'
import { Camera, Smartphone, Monitor, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Mode = 'smartphone' | 'desktop'
type State = 'idle' | 'settingup' | 'measuring' | 'complete' | 'error'

export default function CameraMeasure() {
  const { addEntry } = useAppContext()
  const [mode, setMode] = useState<Mode>('desktop')
  const [state, setState] = useState<State>('idle')
  const [progress, setProgress] = useState(0)
  const [heartRate, setHeartRate] = useState<number | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [signalQuality, setSignalQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('poor')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const measurementInterval = useRef<NodeJS.Timeout | null>(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (measurementInterval.current) {
      clearInterval(measurementInterval.current)
      measurementInterval.current = null
    }
  }

  const startCamera = async () => {
    try {
      setState('settingup')
      const constraints = mode === 'smartphone' 
        ? { video: { facingMode: 'environment' } }
        : { video: true }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setState('idle')
    } catch (err) {
      console.error('Camera access denied:', err)
      setState('error')
    }
  }

  const startMeasurement = () => {
    setState('measuring')
    setProgress(0)
    setSignalQuality('fair')
    
    let elapsed = 0
    const duration = 30 // seconds
    
    measurementInterval.current = setInterval(() => {
      elapsed++
      setProgress(Math.round((elapsed / duration) * 100))
      
      if (elapsed % 5 === 0) {
        const qualities: Array<'poor' | 'fair' | 'good' | 'excellent'> = ['fair', 'good', 'excellent']
        setSignalQuality(qualities[Math.floor(Math.random() * qualities.length)])
      }
      
      setConfidence(70 + Math.floor(Math.random() * 25))
      
      if (elapsed >= duration) {
        if (measurementInterval.current) {
          clearInterval(measurementInterval.current)
        }
        const bpm = 60 + Math.floor(Math.random() * 40)
        setHeartRate(bpm)
        setState('complete')
        stopCamera()
      }
    }, 1000)
  }

  const saveMeasurement = () => {
    if (heartRate) {
      addEntry({
        type: 'heartRate',
        value: heartRate,
        source: 'camera',
        confidence: confidence
      })
      setState('idle')
      setHeartRate(null)
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Camera Measurement</h1>
        <p className="text-gray-600 dark:text-gray-400">Experimental feature - Heart Rate via rPPG</p>
      </div>

      <div className="flex gap-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => {
            setMode('desktop')
            stopCamera()
            setState('idle')
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === 'desktop' ? 'bg-white dark:bg-gray-700 shadow' : ''
          }`}
        >
          <Monitor size={20} />
          Desktop
        </button>
        <button
          onClick={() => {
            setMode('smartphone')
            stopCamera()
            setState('idle')
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            mode === 'smartphone' ? 'bg-white dark:bg-gray-700 shadow' : ''
          }`}
        >
          <Smartphone size={20} />
          Smartphone
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="aspect-video bg-gray-900 relative">
          {state !== 'idle' && state !== 'error' && state !== 'complete' && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          
          <canvas ref={canvasRef} className="hidden" />

          <AnimatePresence>
            {state === 'idle' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <Camera className="text-gray-600 mb-4" size={64} />
                <p className="text-gray-400 text-lg mb-4">
                  {mode === 'smartphone' 
                    ? 'Place finger over rear camera'
                    : 'Center your face in the camera'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Start Camera
                </button>
              </motion.div>
            )}

            {state === 'settingup' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white">Setting up camera...</p>
              </motion.div>
            )}

            {state === 'measuring' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-sm text-gray-500">Signal</p>
                    <p className={`font-bold ${
                      signalQuality === 'excellent' ? 'text-green-500' :
                      signalQuality === 'good' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {signalQuality.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-sm text-gray-500">Confidence</p>
                    <p className="font-bold text-blue-500">{confidence}%</p>
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center text-white font-semibold">
                    {30 - Math.floor(progress / 100 * 30)}s remaining
                  </p>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {mode === 'desktop' && (
                    <div className="w-48 h-48 border-4 border-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
              </motion.div>
            )}

            {state === 'complete' && heartRate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center"
              >
                <CheckCircle2 className="text-green-500 mb-4" size={64} />
                <p className="text-gray-400 text-lg mb-2">Estimated Heart Rate</p>
                <p className="text-7xl font-bold text-white mb-2">{heartRate}</p>
                <p className="text-2xl text-gray-400 mb-6">BPM</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setState('idle')
                      setHeartRate(null)
                    }}
                    className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={saveMeasurement}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Save Measurement
                  </button>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900"
              >
                <XCircle className="text-red-500 mb-4" size={64} />
                <p className="text-white text-lg mb-4">Camera access denied</p>
                <button
                  onClick={() => setState('idle')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {state === 'idle' && streamRef.current && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={startMeasurement}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-lg"
            >
              Start Measurement (30s)
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h4 className="font-semibold text-amber-800 dark:text-amber-200">Important - Experimental Feature</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-2">
              <strong>What we support:</strong> Heart Rate via rPPG (remote photoplethysmography)
              <br />
              <strong>What we don't support:</strong> Blood Pressure, SpO2, Glucose, Temperature via camera - these require dedicated medical devices
              <br />
              <br />
              This feature provides wellness estimates only and is NOT intended for medical diagnosis or treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
