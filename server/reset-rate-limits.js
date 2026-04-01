/**
 * Manual Rate Limit Reset Script
 * 
 * Use this script when you get a new API key to reset the local rate limiting counters.
 * This ensures you start fresh with the new key's quota.
 */

import rateLimitHandler from './utils/rateLimitHandler.js'

console.log('🔄 Resetting rate limiting counters...')

// Get current status
const beforeStatus = rateLimitHandler.getQuotaStatus()
console.log('📊 Before reset:', {
    minuteUsed: beforeStatus.minuteQuota.used,
    dailyUsed: beforeStatus.dailyQuota.used
})

// Reset counters
rateLimitHandler.manualReset()

// Get new status
const afterStatus = rateLimitHandler.getQuotaStatus()
console.log('✅ After reset:', {
    minuteUsed: afterStatus.minuteQuota.used,
    dailyUsed: afterStatus.dailyQuota.used
})

console.log('🎉 Rate limiting counters have been reset!')
console.log('💡 You can now make fresh API calls with your new key.')

process.exit(0)