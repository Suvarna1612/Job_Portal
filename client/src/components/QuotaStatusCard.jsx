import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'

const QuotaStatusCard = () => {
  const [quotaStatus, setQuotaStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const { backendUrl, companyToken } = useContext(AppContext)

  const fetchQuotaStatus = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + '/api/company/quota-status',
        { headers: { token: companyToken } }
      )
      if (data.success) {
        setQuotaStatus(data)
      }
    } catch (error) {
      console.error('Error fetching quota status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (companyToken) {
      fetchQuotaStatus()
      // Refresh every 30 seconds
      const interval = setInterval(fetchQuotaStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [companyToken])

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const getStatusColor = (used, limit) => {
    const percentage = (used / limit) * 100
    if (percentage >= 90) return 'text-red-600 bg-red-50'
    if (percentage >= 70) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!quotaStatus) return null

  const { quotaStatus: quota, recommendations } = quotaStatus

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">AI Analysis Quota</h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          recommendations.canProcessApplications 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {recommendations.canProcessApplications ? 'Available' : 'Limited'}
        </div>
      </div>

      <div className="space-y-3">
        {/* Minute Quota */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Per Minute</span>
            <span>{quota.minuteQuota.used}/{quota.minuteQuota.limit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getStatusColor(quota.minuteQuota.used, quota.minuteQuota.limit).includes('red') 
                  ? 'bg-red-500' 
                  : getStatusColor(quota.minuteQuota.used, quota.minuteQuota.limit).includes('orange')
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${(quota.minuteQuota.used / quota.minuteQuota.limit) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Resets in {formatTime(quota.minuteQuota.resetIn)}
          </div>
        </div>

        {/* Daily Quota */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Daily</span>
            <span>{quota.dailyQuota.used}/{quota.dailyQuota.limit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getStatusColor(quota.dailyQuota.used, quota.dailyQuota.limit).includes('red') 
                  ? 'bg-red-500' 
                  : getStatusColor(quota.dailyQuota.used, quota.dailyQuota.limit).includes('orange')
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${(quota.dailyQuota.used / quota.dailyQuota.limit) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Resets in {formatTime(quota.dailyQuota.resetIn)}
          </div>
        </div>

        {recommendations.suggestedBatchSize < 5 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-3">
            <p className="text-xs text-orange-700">
              <strong>Tip:</strong> Process applications in smaller batches ({recommendations.suggestedBatchSize} at a time) to avoid hitting limits.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuotaStatusCard