# Google Gemini API Rate Limiting Guide

## Overview

This guide explains how rate limiting is handled for the Google Gemini API in the job portal application, including quota limits, error handling, and best practices for efficient API usage.

## API Quota Limits

### Free Tier Limits
- **15 requests per minute (RPM)**
- **1 million tokens per minute**
- **1,500 requests per day**

### Quota Reset Schedule
- **Per-minute quotas**: Reset every 60 seconds (rolling window)
- **Daily quotas**: Reset at midnight UTC
- **Rate limits**: Rolling window, not fixed intervals

## Efficient Analytics Processing

### Smart Analytics Detection
The system now intelligently identifies which applications truly need analytics processing:

- **Never re-processes** applications that already have valid analytics
- **Checks for `analysisDate`** to ensure analytics were properly completed
- **Skips applications** with missing resume or job description data
- **Provides detailed statistics** on processing needs

### Analytics Helper Utilities (`server/utils/analyticsHelper.js`)
- `needsAnalytics()` - Determines if an application needs processing
- `getApplicationsNeedingAnalytics()` - Efficiently finds unprocessed applications
- `getAnalyticsStats()` - Provides processing statistics
- `logAnalyticsProcessing()` - Consistent logging for monitoring

## Implementation Details

### 1. Rate Limit Handler (`server/utils/rateLimitHandler.js`)

A comprehensive utility that:
- Tracks request counts locally
- Implements exponential backoff retry logic
- Provides quota status information
- Handles both API and internal rate limiting

### 2. Enhanced Error Handling

#### Backend (`server/controllers/userController.js`)
- Automatic retry with exponential backoff
- Graceful degradation when quotas are exceeded
- Detailed error messages with retry information
- Fallback behavior for rate-limited scenarios

#### Frontend (`client/src/components/RateLimitNotification.jsx`)
- User-friendly rate limit notifications
- Countdown timers for retry availability
- Quota information display
- Automatic retry functionality

### 3. Monitoring Dashboard

#### Quota Status Card (`client/src/components/QuotaStatusCard.jsx`)
- Real-time quota monitoring
- Visual progress bars for usage
- Recommendations for batch processing
- Auto-refresh every 30 seconds

## API Endpoints

### Generate Analytics (Only for New Applications)
```
POST /api/company/generate-analytics
```

Processes only applications that don't have analytics, preventing wasteful re-processing.

### Check Analytics Statistics
```
GET /api/company/analytics-stats
```

Returns statistics about analytics processing status:
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "withAnalytics": 140,
    "withoutAnalytics": 10,
    "percentageProcessed": 93,
    "needsProcessing": true,
    "message": "10 applications need analytics processing"
  }
}
```

### Check Quota Status
```
GET /api/company/quota-status
```

Returns current quota usage and recommendations for batch processing.

## Best Practices for Quota Conservation

### 1. **Never Re-process Existing Analytics**
- The system automatically skips applications with valid analytics
- Analytics are marked with `analysisDate` timestamp
- Zero scores are preserved (they're valid results, not missing data)

### 2. **Batch Processing Optimization**
- Process applications in small batches (5-10 at a time)
- Add 2-second delays between requests
- Monitor quota status before large operations
- Stop processing when rate limits are hit

### 3. **Efficient Data Validation**
- Check for resume and job description before processing
- Validate analytics structure before API calls
- Use helper functions to determine processing needs

### 4. **Smart Scheduling**
- Process during off-peak hours when possible
- Spread large batches across multiple time periods
- Use analytics statistics to plan processing

## Error Handling Flow

### When Rate Limit is Hit:

1. **API Response**: 429 status with retry delay
2. **Backend Processing**: 
   - Parse retry delay from error details
   - Implement exponential backoff
   - Return structured error response
3. **Frontend Display**:
   - Show user-friendly notification
   - Display countdown timer
   - Provide retry button when available

### Error Response Format:

```json
{
  "success": false,
  "message": "AI analysis is temporarily unavailable due to high demand.",
  "rateLimitInfo": {
    "isRateLimited": true,
    "retryAfter": 20,
    "message": "Please wait 20 seconds before trying again.",
    "quotaInfo": {
      "dailyLimit": "1,500 requests per day",
      "minuteLimit": "15 requests per minute",
      "resetTime": "Quotas reset every minute and daily at midnight UTC"
    }
  }
}
```

## Monitoring and Optimization

### Real-time Monitoring
- Quota usage displayed in company dashboard
- Analytics statistics showing processing status
- Color-coded status indicators (green/orange/red)
- Automatic refresh every 30 seconds

### Processing Statistics
- Total applications vs. processed applications
- Percentage completion tracking
- Identification of applications needing processing
- Detailed logging for audit trails

## Troubleshooting

### Common Issues:

1. **"All applications already have analytics"**
   - **Cause**: No new applications to process
   - **Solution**: This is normal - no action needed
   - **Prevention**: Check analytics stats before processing

2. **"Too Many Requests" Error**
   - **Cause**: Exceeded 15 requests per minute
   - **Solution**: Wait 60 seconds and retry
   - **Prevention**: Use smaller batch sizes

3. **Daily Quota Exceeded**
   - **Cause**: Exceeded 1,500 requests per day
   - **Solution**: Wait until midnight UTC
   - **Prevention**: Monitor daily usage and pace requests

### Debug Information:

Check server logs for:
- Applications skipped (already processed)
- New applications being processed
- Quota status updates
- Processing statistics

## Configuration

### Environment Variables:
```env
GEMINI_API_KEY=your_api_key_here
```

### Processing Settings:
- 2-second delay between requests
- Maximum 2 retry attempts
- Automatic batch size recommendations
- Smart application filtering

## Quota Conservation Tips

1. **Use Analytics Stats Endpoint** - Check processing needs before running batch operations
2. **Process Incrementally** - Handle new applications as they come in
3. **Monitor Usage** - Keep track of daily quota consumption
4. **Optimize Timing** - Process during low-usage periods
5. **Validate Data** - Ensure applications have required data before processing

This approach ensures efficient use of your API quota while maintaining high-quality analytics for all applications.