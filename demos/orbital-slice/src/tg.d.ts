interface TelegramWebApp {
  expand: () => void
  viewportHeight: number
  isFullscreen: boolean
  contentSafeAreaInset: {
    top: number
    bottom: number
    right: number
  }
  onEvent: (event: string, callback: () => void) => void
  offEvent: (event: string, callback: () => void) => void
  addToHomeScreen: () => void
  lockOrientation: () => void
  requestFullscreen: () => void
  Accelerometer: Accelerometer // Provides access to the Accelerometer API
  checkHomeScreenStatus: (
    callback?: (status: 'unsupported' | 'unknown' | 'added' | 'missed') => void
  ) => 'unsupported' | 'unknown' | 'added' | 'missed'
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp // Defines the Telegram WebApp interface
  }
}

interface AccelerometerStartParams {
  refresh_rate?: number
}

interface Accelerometer {
  isStarted: boolean
  x: number
  y: number
  z: number
  start: (params?: AccelerometerStartParams, callback?: (success: boolean) => void) => Accelerometer
  stop: (callback?: (success: boolean) => void) => Accelerometer
}
