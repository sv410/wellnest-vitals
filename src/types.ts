export type VitalType = 
  | 'heartRate'
  | 'bloodPressure'
  | 'bloodOxygen'
  | 'respiratoryRate'
  | 'temperature'
  | 'weight'
  | 'height'
  | 'bloodSugar'
  | 'sleepHours'
  | 'steps'
  | 'waterIntake';

export type VitalSource = 'manual' | 'google_fit' | 'apple_health' | 'camera';

export interface VitalEntry {
  id: string;
  type: VitalType;
  value: number | { systolic: number; diastolic: number };
  source: VitalSource;
  timestamp: number;
  notes?: string;
  confidence?: number;
}

export interface VitalConfig {
  name: string;
  unit: string;
  normalRange: [number, number];
  icon: string;
  color: string;
  description: string;
}

export interface ComparisonMetric {
  method: string;
  easeOfUse: number;
  accuracy: number;
  cost: number;
  setup: number;
  reliability: number;
}

export const VITAL_CONFIGS: Record<VitalType, VitalConfig> = {
  heartRate: {
    name: 'Heart Rate',
    unit: 'BPM',
    normalRange: [60, 100],
    icon: 'activity',
    color: 'text-rose-500',
    description: 'Measures your heart beats per minute'
  },
  bloodPressure: {
    name: 'Blood Pressure',
    unit: 'mmHg',
    normalRange: [90, 120],
    icon: 'heart',
    color: 'text-red-500',
    description: 'Systolic and diastolic pressure'
  },
  bloodOxygen: {
    name: 'Blood Oxygen',
    unit: '%',
    normalRange: [95, 100],
    icon: 'droplets',
    color: 'text-blue-500',
    description: 'SpO2 saturation level'
  },
  respiratoryRate: {
    name: 'Respiratory Rate',
    unit: 'bpm',
    normalRange: [12, 20],
    icon: 'wind',
    color: 'text-emerald-500',
    description: 'Breaths per minute'
  },
  temperature: {
    name: 'Temperature',
    unit: '°F',
    normalRange: [97, 99],
    icon: 'thermometer',
    color: 'text-orange-500',
    description: 'Body temperature'
  },
  weight: {
    name: 'Weight',
    unit: 'lbs',
    normalRange: [100, 200],
    icon: 'scale',
    color: 'text-indigo-500',
    description: 'Body weight'
  },
  height: {
    name: 'Height',
    unit: 'in',
    normalRange: [60, 75],
    icon: 'ruler',
    color: 'text-violet-500',
    description: 'Body height'
  },
  bloodSugar: {
    name: 'Blood Sugar',
    unit: 'mg/dL',
    normalRange: [70, 140],
    icon: 'flask-conical',
    color: 'text-amber-500',
    description: 'Glucose level'
  },
  sleepHours: {
    name: 'Sleep',
    unit: 'hrs',
    normalRange: [7, 9],
    icon: 'moon',
    color: 'text-purple-500',
    description: 'Hours of sleep'
  },
  steps: {
    name: 'Steps',
    unit: '',
    normalRange: [10000, 20000],
    icon: 'footprints',
    color: 'text-green-500',
    description: 'Steps walked'
  },
  waterIntake: {
    name: 'Water',
    unit: 'oz',
    normalRange: [64, 100],
    icon: 'droplet',
    color: 'text-cyan-500',
    description: 'Water intake'
  }
};
