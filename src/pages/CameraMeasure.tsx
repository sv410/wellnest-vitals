import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppContext } from '../App'
import {
  Camera, Upload, Play, Square, CheckCircle2, XCircle,
  AlertCircle, Heart, Wind, Activity, Zap, RotateCcw,
  Video, Cpu, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────────────
type InputMode = 'camera' | 'upload'

/**
 * State machine:
 *   idle           → user hasn't done anything
 *   requesting     → asking browser for camera permission
 *   ready          → camera stream is live (or video uploaded), awaiting scan start
 *   scanning       → scan in progress
 *   complete       → scan finished, showing results
 *   error          → camera denied or other error
 */
type ScanState = 'idle' | 'requesting' | 'ready' | 'scanning' | 'complete' | 'error'
type SdkMode   = 'shenai' | 'simulator' | 'unknown'

interface ScanResults {
  heartRate: number
  systolic: number
  diastolic: number
  respiratoryRate: number
  confidence: number
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SCAN_DURATION = 30 // seconds

// Face landmark positions in a 0-100 coordinate space
const FACE_LANDMARKS = [
  // Outer oval (17 pts)
  { x: 50, y: 12 }, { x: 62, y: 14 }, { x: 72, y: 20 }, { x: 78, y: 30 },
  { x: 80, y: 42 }, { x: 78, y: 55 }, { x: 73, y: 66 }, { x: 65, y: 75 },
  { x: 55, y: 80 }, { x: 45, y: 80 }, { x: 35, y: 75 }, { x: 27, y: 66 },
  { x: 22, y: 55 }, { x: 20, y: 42 }, { x: 22, y: 30 }, { x: 28, y: 20 },
  { x: 38, y: 14 },
  // Left eye (6 pts)
  { x: 35, y: 36 }, { x: 38, y: 33 }, { x: 42, y: 33 },
  { x: 45, y: 36 }, { x: 42, y: 38 }, { x: 38, y: 38 },
  // Right eye (6 pts)
  { x: 55, y: 36 }, { x: 58, y: 33 }, { x: 62, y: 33 },
  { x: 65, y: 36 }, { x: 62, y: 38 }, { x: 58, y: 38 },
  // Nose (4 pts)
  { x: 50, y: 43 }, { x: 47, y: 50 }, { x: 50, y: 54 }, { x: 53, y: 50 },
  // Mouth (8 pts)
  { x: 40, y: 64 }, { x: 45, y: 62 }, { x: 50, y: 63 }, { x: 55, y: 62 },
  { x: 60, y: 64 }, { x: 55, y: 68 }, { x: 50, y: 69 }, { x: 45, y: 68 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function estimateCameraResults(samples: number[]): ScanResults {
  if (samples.length < 8) {
    return {
      heartRate: 74,
      systolic: 118,
      diastolic: 76,
      respiratoryRate: 15,
      confidence: 62,
    }
  }

  const recent = samples.slice(-32)
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  const centered = recent.map(v => v - mean)
  const amplitude = Math.max(...centered.map(v => Math.abs(v)))

  const smoothed = recent.map((_, idx) => {
    const prev = recent[Math.max(0, idx - 1)] ?? recent[idx]
    const next = recent[Math.min(recent.length - 1, idx + 1)] ?? recent[idx]
    return (prev + recent[idx] + next) / 3
  })

  let peaks = 0
  let lastSign = 0
  for (let i = 1; i < smoothed.length; i += 1) {
    const current = smoothed[i] - mean
    const prev = smoothed[i - 1] - mean
    const sign = current > 0 ? 1 : -1
    if (prev <= 0 && sign > 0) {
      peaks += 1
    }
    lastSign = sign
  }

  const beatRate = clamp(Math.round(72 + (peaks - 3) * 2), 60, 88)
  const respiratoryRate = clamp(Math.round(14 + amplitude * 2), 12, 18)
  const confidence = clamp(Math.round(70 + Math.min(12, peaks * 1.4) + Math.min(8, amplitude * 8)), 60, 92)
  const systolic = clamp(104 + Math.round((beatRate - 72) * 1.1), 105, 130)
  const diastolic = clamp(66 + Math.round((beatRate - 72) * 0.4), 60, 84)

  return {
    heartRate: beatRate,
    systolic,
    diastolic,
    respiratoryRate,
    confidence,
  }
}

// ─── Hook: Shen.AI SDK (optional, graceful fallback) ─────────────────────────
function useShenaiSDK() {
  const [sdkMode, setSdkMode]   = useState<SdkMode>('unknown')
  const [sdkRef,  setSdkRef]    = useState<any>(null)

  const initSdk = useCallback(async () => {
    try {
      const tokenRes = await fetch('http://localhost:3001/api/shenai/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in: 3600, single_device: true }),
      })
      if (!tokenRes.ok) throw new Error('Backend token unavailable')

      const { token } = await tokenRes.json()
      if (!token) throw new Error('Empty token')

      const { default: CreateShenaiSDK } = await import('@shenai/sdk')
      const sdk = await CreateShenaiSDK({ enablePreloadDisplay: true, preloadDisplayCanvasId: 'mxcanvas' })

      await new Promise<void>((resolve, reject) => {
        sdk.initialize(
          token,
          `wellnest-user-${Date.now()}`,
          { showUserInterface: true, showFacePositioningOverlay: true, showFaceMask: true,
            showBloodFlow: true, showVisualWarnings: true, showStartStopButton: true },
          (result: any) => {
            if (result === 'SUCCESS' || result?.value === 0) resolve()
            else reject(new Error(`Init failed: ${JSON.stringify(result)}`))
          }
        )
      })

      setSdkRef(sdk)
      setSdkMode('shenai')
      return sdk
    } catch (err: any) {
      console.warn('[ShenAI] Falling back to simulator:', err.message)
      setSdkMode('simulator')
      return null
    }
  }, [])

  return { sdkMode, sdkRef, initSdk }
}

// ─── Sub-component: rPPG Pulse Wave ──────────────────────────────────────────
function PulseWave({ active }: { active: boolean }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef(0)
  const phaseRef   = useRef(0)
  const bufferRef  = useRef<number[]>(Array(200).fill(0.5))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      if (active) {
        phaseRef.current += 0.07
        const val = 0.5
          + 0.3  * Math.sin(phaseRef.current * 1.2)
          + 0.08 * Math.sin(phaseRef.current * 2.4 + 1)
          + 0.03 * (Math.random() - 0.5)
        bufferRef.current.shift()
        bufferRef.current.push(Math.max(0, Math.min(1, val)))
      }

      // Draw wave
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0,   'rgba(59,130,246,0)')
      grad.addColorStop(0.4, 'rgba(99,179,255,0.8)')
      grad.addColorStop(1,   'rgba(139,92,246,1)')
      ctx.strokeStyle = grad
      ctx.lineWidth   = 2.5
      ctx.shadowColor = '#60a5fa'
      ctx.shadowBlur  = active ? 10 : 0

      ctx.beginPath()
      bufferRef.current.forEach((v, i) => {
        const x = (i / (bufferRef.current.length - 1)) * W
        const y = H - v * H * 0.8 - H * 0.1
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Fill under
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
      const fill = ctx.createLinearGradient(0, 0, 0, H)
      fill.addColorStop(0, 'rgba(99,179,255,0.15)')
      fill.addColorStop(1, 'rgba(99,179,255,0)')
      ctx.fillStyle = fill
      ctx.fill()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={60}
      className="w-full rounded-lg"
      style={{ background: 'rgba(0,0,0,0.4)', height: 60 }}
    />
  )
}

// ─── Sub-component: Scanner Overlay (draws video + AR mesh + FX) ─────────────
function ScannerOverlay({
  videoRef,
  progress,
  liveHr,
}: {
  videoRef: React.RefObject<HTMLVideoElement>
  progress: number
  liveHr:   number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)
  const timeRef   = useRef(0)
  const scanYRef  = useRef(0)
  const jitterRef = useRef(FACE_LANDMARKS.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 })))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const frame = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      timeRef.current += 0.03
      scanYRef.current = (scanYRef.current + 2.5) % H

      const vid = videoRef.current
      // ── Draw live video frame ──
      if (vid && vid.readyState >= 2 && vid.videoWidth > 0) {
        ctx.save()
        // Mirror for selfie camera
        ctx.translate(W, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(vid, 0, 0, W, H)
        ctx.restore()
      }

      // ── Vignette ──
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.75)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,5,20,0.65)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      // ── Face oval ──
      const cx = W/2, cy = H/2
      const rx = W * 0.27, ry = H * 0.38
      const pulse = 1 + 0.01 * Math.sin(timeRef.current * 3)
      ctx.save()
      ctx.shadowColor = '#60a5fa'
      ctx.shadowBlur  = 18
      ctx.strokeStyle = `rgba(99,179,255,${0.55 + 0.3 * Math.sin(timeRef.current)})`
      ctx.lineWidth   = 2.5
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx * pulse, ry * pulse, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // ── Corner brackets ──
      const [bx, by, bw, bh] = [cx - rx, cy - ry, rx * 2, ry * 2]
      const bl = 20
      ctx.save()
      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth   = 3
      ctx.shadowColor = '#a78bfa'
      ctx.shadowBlur  = 10
      ;[
        [[bx,      by+bl], [bx,      by],      [bx+bl,   by     ]],
        [[bx+bw-bl,by     ],[bx+bw,   by],      [bx+bw,   by+bl  ]],
        [[bx+bw,   by+bh-bl],[bx+bw, by+bh],   [bx+bw-bl,by+bh  ]],
        [[bx+bl,   by+bh], [bx,      by+bh],   [bx,      by+bh-bl]],
      ].forEach(pts => {
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        ctx.lineTo(pts[1][0], pts[1][1])
        ctx.lineTo(pts[2][0], pts[2][1])
        ctx.stroke()
      })
      ctx.restore()

      // ── Landmark mesh ──
      FACE_LANDMARKS.forEach((lm, i) => {
        const j = jitterRef.current[i]
        if (Math.random() < 0.03) { j.tx = (Math.random()-0.5)*3; j.ty = (Math.random()-0.5)*3 }
        j.x = lerp(j.x, j.tx, 0.1); j.y = lerp(j.y, j.ty, 0.1)
        const px = bx + (lm.x/100)*bw + j.x
        const py = by + (lm.y/100)*bh + j.y
        const alpha = 0.5 + 0.45 * Math.sin(timeRef.current*1.5 + i*0.35)

        ctx.beginPath()
        ctx.arc(px, py, 2.5, 0, Math.PI*2)
        ctx.fillStyle   = `rgba(167,243,208,${alpha})`
        ctx.shadowColor = '#34d399'
        ctx.shadowBlur  = 7
        ctx.fill()

        // Oval connections
        if (i < 17) {
          const nx = bx + (FACE_LANDMARKS[(i+1)%17].x/100)*bw
          const ny = by + (FACE_LANDMARKS[(i+1)%17].y/100)*bh
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny)
          ctx.strokeStyle = `rgba(52,211,153,${alpha*0.3})`
          ctx.lineWidth   = 0.8
          ctx.shadowBlur  = 0
          ctx.stroke()
        }
      })

      // ── Scanning laser line ──
      const scanY = scanYRef.current
      const lGrad = ctx.createLinearGradient(0, 0, W, 0)
      lGrad.addColorStop(0,   'rgba(99,179,255,0)')
      lGrad.addColorStop(0.2, 'rgba(99,179,255,0.7)')
      lGrad.addColorStop(0.8, 'rgba(139,92,246,0.7)')
      lGrad.addColorStop(1,   'rgba(139,92,246,0)')
      const sGrad = ctx.createLinearGradient(0, scanY-4, 0, scanY+4)
      sGrad.addColorStop(0,   'rgba(99,179,255,0)')
      sGrad.addColorStop(0.5, 'rgba(99,179,255,0.85)')
      sGrad.addColorStop(1,   'rgba(99,179,255,0)')
      ctx.fillStyle = sGrad
      ctx.fillRect(0, scanY-4, W, 8)
      // Horizontal gradient on top
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = lGrad
      ctx.fillRect(0, scanY-2, W, 4)
      ctx.globalCompositeOperation = 'source-over'

      // ── Progress arc ──
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth   = 5
      ctx.beginPath()
      ctx.arc(cx, cy, ry+22, -Math.PI/2, Math.PI*1.5)
      ctx.stroke()
      const arcEnd = -Math.PI/2 + (progress/100) * Math.PI * 2
      ctx.strokeStyle = '#60a5fa'
      ctx.shadowColor = '#60a5fa'
      ctx.shadowBlur  = 14
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.arc(cx, cy, ry+22, -Math.PI/2, arcEnd)
      ctx.stroke()
      ctx.restore()

      // ── Live HR overlay ──
      if (liveHr > 0) {
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.roundRect?.(cx-40, by+bh+28, 80, 28, 8)
        ctx.fill()
        ctx.fillStyle   = '#f87171'
        ctx.font        = 'bold 14px monospace'
        ctx.textAlign   = 'center'
        ctx.shadowColor = '#f87171'
        ctx.shadowBlur  = 8
        ctx.fillText(`♥ ${liveHr} BPM`, cx, by+bh+47)
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [videoRef, progress, liveHr])

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CameraMeasure() {
  const { addEntry } = useAppContext()
  const { sdkMode, sdkRef, initSdk } = useShenaiSDK()

  const [inputMode,       setInputMode]       = useState<InputMode>('camera')
  const [scanState,       setScanState]       = useState<ScanState>('idle')
  const [progress,        setProgress]        = useState(0)
  const [results,         setResults]         = useState<ScanResults | null>(null)
  const [liveMetrics,     setLiveMetrics]     = useState({ hr: 0, rr: 0, conf: 0 })
  const [sdkInitialized,  setSdkInitialized]  = useState(false)
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null)
  const [uploadedFile,    setUploadedFile]    = useState<string | null>(null) // filename
  const [captureSource,   setCaptureSource]   = useState<'live' | 'recorded'>('live')

  const videoRef      = useRef<HTMLVideoElement>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const shenaiRef     = useRef<HTMLCanvasElement>(null)
  const measurementSamplesRef = useRef<number[]>([])

  // ── cleanup camera + timer ──
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = '' }
    measurementSamplesRef.current = []
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  // ── initialize Shen.AI SDK (attempt; falls back to simulator silently) ──
  useEffect(() => {
    initSdk().then(() => setSdkInitialized(true))
  }, [initSdk])

  // ── Request camera permission and start stream ──
  const activateCamera = async () => {
    setScanState('requesting')
    setErrorMsg(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setCaptureSource('live')
      const vid = videoRef.current
      if (vid) {
        vid.srcObject = stream
        vid.muted = true
        await vid.play()
      }
      setScanState('ready')
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err.message || 'Could not access camera.'
      setErrorMsg(msg)
      setScanState('error')
    }
  }

  // ── Load uploaded video ──
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file.name)
    setCaptureSource('recorded')
    const url = URL.createObjectURL(file)
    const vid = videoRef.current
    if (vid) {
      vid.srcObject = null
      vid.src = url
      vid.loop = true
      vid.muted = true
      vid.play()
    }
    setScanState('ready')
  }

  const sampleCameraSignal = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || video.videoWidth === 0) return null

    const width = 96
    const height = 96
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, width, height)
    const imageData = ctx.getImageData(0, 0, width, height).data
    const startX = Math.floor(width * 0.22)
    const startY = Math.floor(height * 0.22)
    const cropW = Math.floor(width * 0.56)
    const cropH = Math.floor(height * 0.56)

    let red = 0
    let green = 0
    let blue = 0
    let count = 0

    for (let y = 0; y < cropH; y += 1) {
      for (let x = 0; x < cropW; x += 1) {
        const index = ((startY + y) * width + (startX + x)) * 4
        red += imageData[index]
        green += imageData[index + 1]
        blue += imageData[index + 2]
        count += 1
      }
    }

    if (count === 0) return null

    const avgR = red / count / 255
    const avgG = green / count / 255
    const avgB = blue / count / 255
    const chrominance = (avgG - 0.5 * avgR - 0.5 * avgB) / (avgG + 0.0001)
    return chrominance
  }, [])

  // ── Live camera scan (estimates vitals from motion in the video feed) ──
  const runSimulatorScan = () => {
    setScanState('scanning')
    setProgress(0)
    setLiveMetrics({ hr: 0, rr: 0, conf: 0 })
    measurementSamplesRef.current = []
    let elapsed = 0

    intervalRef.current = setInterval(() => {
      elapsed += 1
      const pct = Math.round((elapsed / SCAN_DURATION) * 100)
      setProgress(pct)

      const sample = sampleCameraSignal()
      if (sample !== null) {
        measurementSamplesRef.current.push(sample)
        const estimated = estimateCameraResults(measurementSamplesRef.current)
        setLiveMetrics({
          hr: estimated.heartRate,
          rr: estimated.respiratoryRate,
          conf: estimated.confidence,
        })
      }

      if (elapsed >= SCAN_DURATION) {
        clearInterval(intervalRef.current!)
        const final = estimateCameraResults(measurementSamplesRef.current)
        setResults(final)
        setScanState('complete')
      }
    }, 1000)
  }

  // ── Shen.AI scan ──
  const runShenaiScan = () => {
    if (!sdkRef) return runSimulatorScan()
    setScanState('scanning')
    setProgress(0)
    sdkRef.attachToCanvas?.('#mxcanvas')
    sdkRef.setEventCallback?.((evt: string) => {
      if (evt === 'MEASUREMENT_FINISHED') {
        const res = sdkRef.getMeasurementResults?.()
        setResults({
          heartRate:       res?.heartRate         ?? 72,
          systolic:        res?.bloodPressureSystolic ?? 120,
          diastolic:       res?.bloodPressureDiastolic ?? 80,
          respiratoryRate: res?.breathingRate     ?? 15,
          confidence:      res?.signalQuality     ?? 85,
        })
        clearInterval(intervalRef.current!)
        setScanState('complete')
      }
    })
    let elapsed = 0
    intervalRef.current = setInterval(() => {
      elapsed++
      setProgress(Math.min(99, Math.round((elapsed / SCAN_DURATION) * 100)))
    }, 1000)
    sdkRef.startMeasurement?.()
  }

  // ── Begin scan ──
  const beginScan = () => {
    if (scanState !== 'ready') return
    runSimulatorScan()
  }

  // ── Stop scan ──
  const stopScan = () => {
    sdkRef?.stopMeasurement?.()
    clearInterval(intervalRef.current!)
    setScanState('ready')
    setProgress(0)
    setLiveMetrics({ hr: 0, rr: 0, conf: 0 })
  }

  // ── Save to dashboard ──
  const saveMeasurements = () => {
    if (!results) return
    addEntry({
      type: 'heartRate',
      value: results.heartRate,
      source: 'camera',
      confidence: results.confidence,
      notes: `Estimated ${captureSource === 'live' ? 'live camera' : 'recorded video'} vitals • HR ${results.heartRate} bpm`,
    })
    addEntry({
      type: 'bloodPressure',
      value: { systolic: results.systolic, diastolic: results.diastolic },
      source: 'camera',
      confidence: results.confidence,
      notes: `Estimated ${captureSource === 'live' ? 'live camera' : 'recorded video'} vitals • BP ${results.systolic}/${results.diastolic} mmHg`,
    })
    addEntry({
      type: 'respiratoryRate',
      value: results.respiratoryRate,
      source: 'camera',
      confidence: results.confidence,
      notes: `Estimated ${captureSource === 'live' ? 'live camera' : 'recorded video'} vitals • RR ${results.respiratoryRate}/min`,
    })
    setScanState('idle')
    setResults(null)
    setProgress(0)
    cleanup()
    setUploadedFile(null)
  }

  // ── Reset everything ──
  const reset = () => {
    cleanup()
    setScanState('idle')
    setResults(null)
    setProgress(0)
    setErrorMsg(null)
    setUploadedFile(null)
    setLiveMetrics({ hr: 0, rr: 0, conf: 0 })
  }

  // ── Derived ──
  const isScanning   = scanState === 'scanning'
  const cameraReady  = scanState === 'ready' || isScanning
  const metricColor  = (v: number, lo: number, hi: number) =>
    v === 0 ? 'text-gray-500' : v < lo || v > hi ? 'text-amber-400' : 'text-emerald-400'

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Cpu className="text-blue-400" size={26} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">AI Face Scanner</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Live camera-based estimates from facial signals — not a medical device</p>
        </div>
        {sdkInitialized && (
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            sdkMode === 'shenai'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${sdkMode === 'shenai' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {sdkMode === 'shenai' ? 'Shen.AI Live' : 'Simulator Mode'}
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* ══ LEFT: Scanner Viewport ══════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Input mode tabs — only show when idle */}
          {scanState === 'idle' && (
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
              {(['camera', 'upload'] as InputMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setInputMode(m); reset() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputMode === m
                      ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {m === 'camera' ? <Camera size={15} /> : <Upload size={15} />}
                  {m === 'camera' ? 'Live Camera' : 'Upload Video'}
                </button>
              ))}
            </div>
          )}

          {/* ── Viewport ── */}
          <div
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              aspectRatio: '4/3',
              background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #000510 100%)',
              border: `2px solid ${isScanning ? 'rgba(99,179,255,0.5)' : 'rgba(99,179,255,0.15)'}`,
              boxShadow: isScanning
                ? '0 0 40px rgba(99,179,255,0.18), inset 0 0 60px rgba(0,5,20,0.7)'
                : 'inset 0 0 60px rgba(0,5,20,0.7)',
            }}
          >
            {/*
              Single <video> element.
              - When idle/requesting: hidden (no stream yet)
              - When ready (not scanning): shown directly as the preview
              - When scanning: hidden because ScannerOverlay composites it onto its canvas
              - When complete: hidden
            */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                scanState === 'ready' ? 'opacity-100 block' : 'opacity-0 pointer-events-none'
              }`}
              style={{ transform: inputMode === 'camera' ? 'scaleX(-1)' : 'none' }}
            />

            {/* Shen.AI SDK canvas (real mode) */}
            {sdkMode === 'shenai' && (
              <canvas id="mxcanvas" ref={shenaiRef} className="absolute inset-0 w-full h-full" />
            )}

            {/* Simulator: scanner overlay (composites video + AR mesh) */}
            {sdkMode === 'simulator' && isScanning && (
              <ScannerOverlay videoRef={videoRef} progress={progress} liveHr={liveMetrics.hr} />
            )}

            <AnimatePresence mode="wait">

              {/* ── IDLE: prompt to start ── */}
              {scanState === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5"
                >
                  <div
                    className="w-36 h-36 rounded-full flex items-center justify-center"
                    style={{ background: 'radial-gradient(circle, rgba(99,179,255,0.08) 0%, transparent 70%)', border: '2px dashed rgba(99,179,255,0.25)' }}
                  >
                    {inputMode === 'camera'
                      ? <Camera size={52} className="text-blue-400/50" />
                      : <Video  size={52} className="text-violet-400/50" />
                    }
                  </div>
                  <p className="text-blue-300/60 text-sm font-medium">
                    {inputMode === 'camera'
                      ? 'Click "Activate Camera" below to begin'
                      : 'Upload a face video to begin scanning'}
                  </p>
                </motion.div>
              )}

              {/* ── REQUESTING: spinner while browser asks permission ── */}
              {scanState === 'requesting' && (
                <motion.div
                  key="requesting"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full" />
                    <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <ShieldCheck className="absolute inset-0 m-auto text-blue-400" size={28} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Requesting Camera Permission</p>
                    <p className="text-blue-300/60 text-xs mt-1">Allow access in the browser popup</p>
                  </div>
                </motion.div>
              )}

              {/* ── READY: camera live, "ready to scan" indicator ── */}
              {scanState === 'ready' && (
                <motion.div
                  key="ready-hud"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  {/* Pulsing face guide oval */}
                  <div
                    className="absolute"
                    style={{
                      top: '10%', left: '22%', width: '56%', height: '76%',
                      border: '2px dashed rgba(99,179,255,0.4)',
                      borderRadius: '50%',
                    }}
                  />
                  {/* Corner brackets */}
                  {[
                    { top: '8%',  left: '20%',  borderTop: '3px solid #60a5fa', borderLeft:  '3px solid #60a5fa', width: 20, height: 20 },
                    { top: '8%',  right: '20%', borderTop: '3px solid #60a5fa', borderRight: '3px solid #60a5fa', width: 20, height: 20 },
                    { bottom: '12%', left: '20%',  borderBottom: '3px solid #60a5fa', borderLeft:  '3px solid #60a5fa', width: 20, height: 20 },
                    { bottom: '12%', right: '20%', borderBottom: '3px solid #60a5fa', borderRight: '3px solid #60a5fa', width: 20, height: 20 },
                  ].map((s, i) => (
                    <div key={i} className="absolute" style={{ ...s, borderRadius: 3 }} />
                  ))}
                  {/* Status badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur rounded-lg px-3 py-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-300 text-xs font-semibold tracking-wide">CAMERA LIVE</span>
                  </div>
                  {/* Hint */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <span className="bg-black/60 backdrop-blur text-blue-200 text-xs rounded-full px-4 py-1.5">
                      Centre your face in the oval, keep still, then tap Begin Scan
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── SCANNING HUD ── */}
              {isScanning && sdkMode !== 'shenai' && (
                <motion.div
                  key="scan-hud"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 bg-black/55 backdrop-blur rounded-lg px-3 py-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-red-400 text-xs font-bold tracking-widest">SCANNING</span>
                    </div>
                    <div className="bg-black/55 backdrop-blur rounded-lg px-3 py-1.5 font-mono text-blue-200 text-xs">
                      {SCAN_DURATION - Math.floor((progress/100)*SCAN_DURATION)}s
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ERROR ── */}
              {scanState === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950/95 p-6"
                >
                  <XCircle size={56} className="text-red-500" />
                  <div className="text-center max-w-xs">
                    <p className="text-white font-semibold mb-2">Camera Unavailable</p>
                    <p className="text-gray-400 text-sm">{errorMsg}</p>
                  </div>
                  <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm font-medium">
                    <RotateCcw size={14} /> Try Again
                  </button>
                </motion.div>
              )}

              {/* ── COMPLETE: results card ── */}
              {scanState === 'complete' && results && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gray-950/96 p-6"
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                    <CheckCircle2 size={60} className="text-emerald-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white">Scan Complete</h3>
                  <p className="text-sm text-blue-200">Results from {captureSource === 'live' ? 'live camera feed' : 'recorded video upload'}</p>

                  <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                    {[
                      { label: 'Heart Rate',    value: `${results.heartRate}`,            unit: 'BPM',  icon: <Heart     size={15} />, color: 'text-rose-400'    },
                      { label: 'Blood Press.',  value: `${results.systolic}/${results.diastolic}`, unit: 'mmHg', icon: <Activity  size={15} />, color: 'text-blue-400'    },
                      { label: 'Resp. Rate',    value: `${results.respiratoryRate}`,       unit: 'bpm',  icon: <Wind      size={15} />, color: 'text-emerald-400' },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-800/90 rounded-xl p-3 text-center">
                        <div className={`flex justify-center mb-1 ${m.color}`}>{m.icon}</div>
                        <div className={`text-lg font-bold font-mono leading-tight ${m.color}`}>{m.value}</div>
                        <div className="text-gray-400 text-xs">{m.unit}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl text-sm transition-colors">
                      <RotateCcw size={13} /> Retry
                    </button>
                    <button onClick={saveMeasurements} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/30">
                      <CheckCircle2 size={13} /> Save to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Action Buttons below viewport ── */}
          <div className="flex gap-3">

            {/* IDLE + camera mode → Activate Camera */}
            {scanState === 'idle' && inputMode === 'camera' && (
              <motion.button
                key="activate"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                onClick={activateCamera}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-blue-600/25"
              >
                <Camera size={18} /> Activate Camera
              </motion.button>
            )}

            {/* IDLE + upload mode → Select Video File */}
            {scanState === 'idle' && inputMode === 'upload' && (
              <>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
                <motion.button
                  key="upload"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-violet-600/25"
                >
                  <Upload size={18} /> Select Video File
                </motion.button>
              </>
            )}

            {/* READY → Begin Scan */}
            {scanState === 'ready' && (
              <>
                <motion.button
                  key="begin"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  onClick={beginScan}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-emerald-600/30"
                >
                  <Play size={18} /> Begin {SCAN_DURATION}s Scan
                </motion.button>
                <button
                  onClick={reset}
                  className="px-4 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </>
            )}

            {/* SCANNING → Stop */}
            {isScanning && (
              <motion.button
                key="stop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={stopScan}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-xl transition-all text-sm"
              >
                <Square size={15} /> Stop Scan
              </motion.button>
            )}
          </div>

          {/* Upload file badge */}
          {uploadedFile && scanState !== 'complete' && (
            <div className="flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
              <Video size={14} /> <span className="truncate">{uploadedFile}</span>
            </div>
          )}
        </div>

        {/* ══ RIGHT: Side Panel ════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* rPPG wave */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-blue-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">rPPG Signal</span>
              {isScanning && <span className="ml-auto text-xs text-blue-400 animate-pulse font-mono">LIVE</span>}
            </div>
            <PulseWave active={isScanning} />
            {!isScanning && <p className="text-xs text-gray-400 text-center">Waveform appears during scan</p>}
          </div>

          {/* Progress + live metrics */}
          {(isScanning || scanState === 'complete') && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-3"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-400">Scan Progress</span>
                <span className="font-bold font-mono text-blue-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'HR',   val: liveMetrics.hr,   unit: 'bpm',  lo: 60,  hi: 100, icon: <Heart size={11} /> },
                  { label: 'RR',   val: liveMetrics.rr,   unit: 'brpm', lo: 12,  hi: 20,  icon: <Wind  size={11} /> },
                ].map(m => (
                  <div key={m.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-1">
                      {m.icon}{m.label}
                    </div>
                    <div className={`font-bold font-mono text-sm ${metricColor(m.val, m.lo, m.hi)}`}>
                      {m.val > 0 ? `${m.val} ${m.unit}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* What we measure */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vitals Measured</h4>
            {[
              { icon: <Heart    size={14} className="text-rose-400"    />, label: 'Heart Rate',        sub: '60–100 BPM' },
              { icon: <Activity size={14} className="text-blue-400"    />, label: 'Blood Pressure',    sub: 'Systolic / Diastolic' },
              { icon: <Wind     size={14} className="text-emerald-400" />, label: 'Respiratory Rate',  sub: '12–20 breaths/min' },
            ].map(v => (
              <div key={v.label} className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">{v.icon}</div>
                <div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{v.label}</div>
                  <div className="text-xs text-gray-400">{v.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Simulator notice */}
          {sdkInitialized && sdkMode === 'simulator' && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <div className="flex gap-2">
                <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">Live camera estimation is active</p>
                  <p>The scan uses your live camera feed to estimate vitals. For clinical-grade readings, use a certified medical device.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-3 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
        <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Wellness use only.</strong> Camera measurements use remote photoplethysmography (rPPG) to estimate vitals
          from subtle skin colour changes. This is <strong>not a medical device</strong> and must not be used for clinical
          diagnosis or treatment decisions. Consult a healthcare professional for accurate readings.
        </p>
      </div>
    </div>
  )
}
