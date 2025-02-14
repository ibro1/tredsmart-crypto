type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: any
}

class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private readonly maxLogs = 1000 // Keep last 1000 logs in memory

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }

    // Add to memory logs
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Remove oldest log
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logFn = level === 'error' ? console.error : 
                    level === 'warn' ? console.warn :
                    level === 'debug' ? console.debug :
                    console.log

      logFn(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data || '')
    }

    // TODO: In production, we might want to:
    // 1. Send logs to a logging service
    // 2. Store logs in database
    // 3. Set up alerts for errors
  }

  public info(message: string, data?: any) {
    this.log('info', message, data)
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  public error(message: string, data?: any) {
    this.log('error', message, data)
  }

  public debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  public getLogs(level?: LogLevel): LogEntry[] {
    return level 
      ? this.logs.filter(log => log.level === level)
      : this.logs
  }

  public clearLogs() {
    this.logs = []
  }
}

// Export singleton instance
export const logger = Logger.getInstance()
