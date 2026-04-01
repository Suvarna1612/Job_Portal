import { useState, useEffect } from 'react'
import { assets } from '../assets/assets'

const RateLimitNotification = ({ rateLimitInfo, onRetry, onClose }) => {
  const [countdown, setCountdown] = useState(rateLimitInfo?.retryAfter || 0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [countdown])

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Service Temporarily Busy</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <img src={assets.cross_icon} alt="Close" className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            {rateLimitInfo?.message || 'Our AI analysis service is experiencing high demand. Please wait a moment before trying again.'}
          </p>
          
          {countdown > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700 font-medium">Retry available in:</span>
                <span className="text-lg font-bold text-orange-600">{formatTime(countdown)}</span>
              </div>
              <div className="mt-2 bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((rateLimitInfo?.retryAfter - countdown) / rateLimitInfo?.retryAfter) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {rateLimitInfo?.quotaInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">API Quota Information</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Daily Limit: {rateLimitInfo.quotaInfo.dailyLimit}</div>
                <div>• Per-Minute Limit: {rateLimitInfo.quotaInfo.minuteLimit}</div>
                <div>• Reset Schedule: {rateLimitInfo.quotaInfo.resetTime}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            disabled={countdown > 0}
            className={`px-6 py-2 font-medium rounded-xl transition-colors ${
              countdown > 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {countdown > 0 ? `Retry in ${countdown}s` : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RateLimitNotification