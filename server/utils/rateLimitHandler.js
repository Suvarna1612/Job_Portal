/**
 * Rate Limiting Utility for Google Gemini API
 * 
 * Google Gemini API Free Tier Limits:
 * - 15 requests per minute (RPM)
 * - 1 million tokens per minute
 * - 1,500 requests per day
 * 
 * Quota Reset Information:
 * - Per-minute quotas: Reset every 60 seconds (rolling window)
 * - Daily quotas: Reset at midnight UTC
 */

class RateLimitHandler {
    constructor() {
        this.requestCount = 0
        this.dailyRequestCount = 0
        this.lastResetTime = Date.now()
        this.dailyResetTime = this.getNextMidnightUTC()
    }

    getNextMidnightUTC() {
        const now = new Date()
        const midnight = new Date(now)
        midnight.setUTCHours(24, 0, 0, 0)
        return midnight.getTime()
    }

    resetCountersIfNeeded() {
        const now = Date.now()
        
        // Reset minute counter (rolling 60-second window)
        if (now - this.lastResetTime >= 60000) {
            this.requestCount = 0
            this.lastResetTime = now
        }
        
        // Reset daily counter at midnight UTC
        if (now >= this.dailyResetTime) {
            this.dailyRequestCount = 0
            this.dailyResetTime = this.getNextMidnightUTC()
        }
    }

    // Manual reset function for new API keys
    manualReset() {
        this.requestCount = 0
        this.dailyRequestCount = 0
        this.lastResetTime = Date.now()
        this.dailyResetTime = this.getNextMidnightUTC()
        console.log('🔄 Rate limit counters manually reset (new API key)')
    }

    canMakeRequest() {
        this.resetCountersIfNeeded()
        return this.requestCount < 15 && this.dailyRequestCount < 1500
    }

    incrementRequestCount() {
        this.requestCount++
        this.dailyRequestCount++
    }

    getWaitTime() {
        this.resetCountersIfNeeded()
        
        if (this.requestCount >= 15) {
            // Wait until next minute reset
            return 60000 - (Date.now() - this.lastResetTime)
        }
        
        if (this.dailyRequestCount >= 1500) {
            // Wait until next day reset
            return this.dailyResetTime - Date.now()
        }
        
        return 0
    }

    getQuotaStatus() {
        this.resetCountersIfNeeded()
        
        return {
            minuteQuota: {
                used: this.requestCount,
                limit: 15,
                remaining: 15 - this.requestCount,
                resetIn: 60000 - (Date.now() - this.lastResetTime)
            },
            dailyQuota: {
                used: this.dailyRequestCount,
                limit: 1500,
                remaining: 1500 - this.dailyRequestCount,
                resetIn: this.dailyResetTime - Date.now()
            }
        }
    }
}

// Singleton instance
const rateLimitHandler = new RateLimitHandler()

// Reset counters for new API key (call this once when server starts with new key)
if (process.env.NEW_API_KEY === 'true') {
    rateLimitHandler.manualReset()
}

/**
 * Retry function with exponential backoff for API calls
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - The result of the function call
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Check if we can make a request before trying
            if (!rateLimitHandler.canMakeRequest()) {
                const waitTime = rateLimitHandler.getWaitTime()
                throw new Error(`RATE_LIMIT_EXCEEDED:${waitTime}`)
            }
            
            rateLimitHandler.incrementRequestCount()
            return await fn()
            
        } catch (error) {
            // Handle Gemini API rate limit errors
            if (error.status === 429) {
                const retryAfter = error.errorDetails?.find(detail => 
                    detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
                )?.retryDelay || '20s'
                
                const waitTime = parseRetryDelay(retryAfter)
                
                if (attempt === maxRetries) {
                    throw new Error(`RATE_LIMIT_EXCEEDED:${waitTime}`)
                }
                
                console.log(`⏳ Rate limit hit. Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
                continue
            }
            
            // Handle our internal rate limiting
            if (error.message?.startsWith('RATE_LIMIT_EXCEEDED:')) {
                if (attempt === maxRetries) {
                    throw error
                }
                
                const waitTime = parseInt(error.message.split(':')[1])
                console.log(`⏳ Internal rate limit. Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`)
                await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60000))) // Cap at 1 minute
                continue
            }
            
            // For other errors, use exponential backoff
            if (attempt === maxRetries) {
                throw error
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1)
            console.log(`⏳ Retrying after ${delay}ms (attempt ${attempt}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}

/**
 * Parse retry delay from Google API response
 * @param {string} retryDelay - Retry delay string (e.g., "20s")
 * @returns {number} - Delay in milliseconds
 */
export const parseRetryDelay = (retryDelay) => {
    if (typeof retryDelay === 'string') {
        const match = retryDelay.match(/(\d+)s/)
        return match ? parseInt(match[1]) * 1000 : 20000 // Default 20 seconds
    }
    return 20000
}

/**
 * Get current quota status
 * @returns {Object} - Current quota information
 */
export const getQuotaStatus = () => {
    return rateLimitHandler.getQuotaStatus()
}

/**
 * Format rate limit error response
 * @param {number} waitTime - Wait time in milliseconds
 * @returns {Object} - Formatted error response
 */
export const formatRateLimitError = (waitTime) => {
    const waitTimeSeconds = Math.ceil(waitTime / 1000)
    const waitTimeMinutes = Math.ceil(waitTimeSeconds / 60)
    
    let timeMessage
    if (waitTimeSeconds < 60) {
        timeMessage = `${waitTimeSeconds} seconds`
    } else if (waitTimeMinutes < 60) {
        timeMessage = `${waitTimeMinutes} minutes`
    } else {
        const hours = Math.ceil(waitTimeMinutes / 60)
        timeMessage = `${hours} hours`
    }
    
    return {
        isRateLimited: true,
        retryAfter: waitTimeSeconds,
        message: `AI analysis is temporarily unavailable due to high demand. Please try again in ${timeMessage}.`,
        quotaInfo: {
            dailyLimit: "1,500 requests per day",
            minuteLimit: "15 requests per minute",
            resetTime: "Quotas reset every minute and daily at midnight UTC",
            currentStatus: getQuotaStatus()
        }
    }
}

export default rateLimitHandler