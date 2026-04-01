/**
 * Analytics Helper Utilities
 * 
 * Provides utility functions to manage AI analytics efficiently
 * and avoid unnecessary API calls to preserve quota.
 */

/**
 * Check if an application needs analytics processing
 * @param {Object} application - JobApplication document
 * @returns {boolean} - True if analytics are needed
 */
export const needsAnalytics = (application) => {
    // Check if matchAnalytics exists and has analysisDate
    if (!application.matchAnalytics) {
        return true
    }
    
    // Check if analysisDate exists (this indicates it was properly processed)
    if (!application.matchAnalytics.analysisDate) {
        return true
    }
    
    // If we have all required fields with valid analysis date, no need to reprocess
    const hasValidAnalytics = 
        typeof application.matchAnalytics.overallMatch === 'number' &&
        typeof application.matchAnalytics.skillsMatch === 'number' &&
        typeof application.matchAnalytics.experienceMatch === 'number' &&
        typeof application.matchAnalytics.educationMatch === 'number' &&
        application.matchAnalytics.analysisDate instanceof Date
    
    return !hasValidAnalytics
}

/**
 * Get applications that need analytics processing
 * @param {string} companyId - Company ID
 * @returns {Promise<Array>} - Array of applications needing analytics
 */
export const getApplicationsNeedingAnalytics = async (companyId) => {
    const JobApplication = (await import('../models/JobApplication.js')).default
    
    // Find applications that truly don't have analytics
    const applications = await JobApplication.find({
        companyId,
        $or: [
            { matchAnalytics: { $exists: false } },
            { matchAnalytics: null },
            { 'matchAnalytics.analysisDate': { $exists: false } },
            { 'matchAnalytics.analysisDate': null }
        ]
    })
    .populate('userId', 'name resume')
    .populate('jobId', 'title description')
    
    // Double-check each application to ensure it truly needs processing
    return applications.filter(app => {
        // Skip if missing required data
        if (!app.userId?.resume || !app.jobId?.description) {
            return false
        }
        
        // Use our helper function to determine if analytics are needed
        return needsAnalytics(app)
    })
}

/**
 * Create analytics object with current timestamp
 * @param {Object} matchData - Match data from AI analysis
 * @returns {Object} - Complete analytics object
 */
export const createAnalyticsObject = (matchData) => {
    return {
        overallMatch: matchData.overallMatch || 0,
        skillsMatch: matchData.skillsMatch || 0,
        experienceMatch: matchData.experienceMatch || 0,
        educationMatch: matchData.educationMatch || 0,
        analysisDate: new Date()
    }
}

/**
 * Log analytics processing for monitoring
 * @param {string} applicationId - Application ID
 * @param {Object} analytics - Analytics data
 * @param {boolean} isNew - Whether this is a new analysis
 */
export const logAnalyticsProcessing = (applicationId, analytics, isNew = true) => {
    const status = isNew ? 'NEW' : 'UPDATED'
    console.log(`✅ Processed ${status} application ${applicationId} - Overall: ${analytics.overallMatch}% (${new Date().toISOString()})`)
}

/**
 * Get analytics statistics for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} - Analytics statistics
 */
export const getAnalyticsStats = async (companyId) => {
    const JobApplication = (await import('../models/JobApplication.js')).default
    
    const totalApplications = await JobApplication.countDocuments({ companyId })
    
    const withAnalytics = await JobApplication.countDocuments({
        companyId,
        'matchAnalytics.analysisDate': { $exists: true, $ne: null }
    })
    
    const withoutAnalytics = await JobApplication.countDocuments({
        companyId,
        $or: [
            { matchAnalytics: { $exists: false } },
            { matchAnalytics: null },
            { 'matchAnalytics.analysisDate': { $exists: false } },
            { 'matchAnalytics.analysisDate': null }
        ]
    })
    
    return {
        total: totalApplications,
        withAnalytics,
        withoutAnalytics,
        percentageProcessed: totalApplications > 0 ? Math.round((withAnalytics / totalApplications) * 100) : 0
    }
}

export default {
    needsAnalytics,
    getApplicationsNeedingAnalytics,
    createAnalyticsObject,
    logAnalyticsProcessing,
    getAnalyticsStats
}