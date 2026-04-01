# Job Portal - Complete End-to-End Flow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Recruiter Side Flow](#recruiter-side-flow)
3. [Candidate Side Flow](#candidate-side-flow)
4. [AI Analytics System](#ai-analytics-system)
5. [Rate Limiting & Error Handling](#rate-limiting--error-handling)
6. [Database Operations](#database-operations)
7. [Authentication & Security](#authentication--security)

## System Overview

### Architecture
- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: Clerk (for candidates) + Custom JWT (for recruiters)
- **AI Integration**: Google Gemini API for resume analysis
- **File Storage**: Cloudinary for resume uploads
- **Email Service**: Custom email service for notifications

### Key Features
- Job posting and management
- Resume analysis with AI matching
- Application tracking system
- Real-time notifications
- Rate limiting for API calls
- Comprehensive error handling

---

## Recruiter Side Flow

### 1. Recruiter Registration & Authentication

#### 1.1 Registration Process
**Endpoint**: `POST /api/company/register`

**Flow**:
```
1. Recruiter visits registration page
2. Fills form: name, email, password, company logo
3. Frontend validation:
   - All fields required
   - Email format validation
   - Password strength check
4. Submit form with multipart/form-data
```

**Backend Processing**:
```javascript
// Check if company already exists
const companyExists = await Company.findOne({email})
if (companyExists) {
    return res.json({success: false, message: 'Company already registered'})
}

// Hash password
const salt = await bcrypt.genSalt(10)
const hashPassword = await bcrypt.hash(password, salt)

// Upload logo to Cloudinary
const imageUpload = await cloudinary.uploader.upload(imageFile.path)

// Create company record
const company = await Company.create({
    name, email, password: hashPassword, image: imageUpload.secure_url
})

// Generate JWT token
return res.json({
    success: true,
    company: {_id, name, email, image},
    token: generateToken(company._id)
})
```

**Success Scenarios**:
- Company created successfully
- JWT token generated
- Redirect to dashboard

**Error Scenarios**:
- Email already exists → Show error message
- Image upload fails → Show upload error
- Database error → Show generic error
- Missing fields → Show validation errors
#### 1.2 Login Process
**Endpoint**: `POST /api/company/login`

**Flow**:
```
1. Recruiter enters email and password
2. Frontend validation
3. Submit credentials
```

**Backend Processing**:
```javascript
// Find company by email
const company = await Company.findOne({email})
if (!company) {
    return res.json({success: false, message: 'Invalid email or password'})
}

// Compare password
if (await bcrypt.compare(password, company.password)) {
    return res.json({
        success: true,
        company: {_id, name, email, image},
        token: generateToken(company._id)
    })
} else {
    return res.json({success: false, message: 'Invalid email or password'})
}
```

**Success Scenarios**:
- Valid credentials → Login successful, redirect to dashboard
- Token stored in localStorage

**Error Scenarios**:
- Invalid email → Show error message
- Invalid password → Show error message
- Account not found → Show error message

### 2. Dashboard Navigation

#### 2.1 Dashboard Layout
**Components**:
- Top navbar with logo and profile dropdown
- Sidebar with navigation links
- Main content area with routing

**Navigation Options**:
- Add Job (`/dashboard/add-job`)
- Manage Jobs (`/dashboard/manage-jobs`)
- View Applications (`/dashboard/view-applications`)

#### 2.2 Logout Process
**Flow**:
```
1. Click profile image → Dropdown opens
2. Click "Logout" → Direct logout (no confirmation)
3. Clear session data
4. Redirect to home page
```

**Session Cleanup**:
```javascript
const logout = () => {
    setCompanyData(null)
    setCompanyToken(null)
    localStorage.removeItem('companyToken')
    navigate('/')
}
```

### 3. Job Management

#### 3.1 Add New Job
**Endpoint**: `POST /api/company/post-Job`

**Form Fields**:
- Title (required)
- Description (required)
- Location (required, dropdown)
- Category (required, dropdown)
- Experience Level (required)
- Salary (required, number)
- Expiry Date (optional)
- Max Applications (optional)
- Custom Questions (optional, array)

**Frontend Validation**:
```javascript
// Required field validation
if (!title || !description || !location || !salary || !level || !category) {
    return toast.error("Please fill all required fields")
}

// Salary validation
if (salary <= 0) {
    return toast.error("Please enter a valid salary")
}

// Custom questions validation
const validQuestions = customQuestions.filter(q => q.question && q.question.trim() !== '')
```

**Backend Processing**:
```javascript
const jobData = {
    title, description, location, salary, companyId,
    date: Date.now(), level, category
}

// Add optional fields
if (expiryDate) jobData.expiryDate = new Date(expiryDate)
if (maxApplications) jobData.maxApplications = parseInt(maxApplications)
if (customQuestions && customQuestions.length > 0) {
    jobData.customQuestions = customQuestions.filter(q => q.question && q.question.trim() !== '')
}

const newJob = new Job(jobData)
await newJob.save()

// Send notifications to company followers
const followers = await CompanyFollower.find({ companyId, isActive: true })
    .populate('userId', 'name email')

// Send emails in batches
const batchSize = 10
for (let i = 0; i < followers.length; i += batchSize) {
    const batch = followers.slice(i, i + batchSize)
    const emailPromises = batch.map(follower => 
        sendNewJobNotification(follower.userId.email, follower.userId.name, title, company.name, newJob._id, location, salary)
    )
    await Promise.all(emailPromises)
    if (i + batchSize < followers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
    }
}
```

**Success Scenarios**:
- Job created successfully
- Followers notified via email
- Redirect to manage jobs page

**Error Scenarios**:
- Missing required fields → Show validation errors
- Database error → Show error message
- Email notification fails → Job still created, log error
#### 3.2 Manage Jobs
**Endpoint**: `GET /api/company/list-jobs`

**Features**:
- View all posted jobs
- Edit job details
- Delete jobs
- Toggle job visibility
- View application statistics
- Monitor API quota usage

**Job Status Indicators**:
```javascript
const isExpired = job.expiryDate && new Date(job.expiryDate) < new Date()
const isMaxReached = job.maxApplications && job.applicationCount >= job.maxApplications

// Status display logic
if (isExpired) {
    status = "Expired"
} else if (isMaxReached) {
    status = "Limit Reached"
} else if (job.expiryDate) {
    status = `Expires ${moment(job.expiryDate).format('MMM D')}`
} else {
    status = "Active"
}
```

**Visibility Toggle**:
```javascript
const changeJobVisibility = async (id) => {
    const { data } = await axios.post('/api/company/change-visibility', { id })
    if (data.success) {
        toast.success(data.message)
        fetchCompanyJobs() // Refresh list
    }
}
```

**Edit Job Flow**:
```
1. Click edit icon → Open edit modal
2. Pre-populate form with existing data
3. Modify fields as needed
4. Submit changes
5. Update database
6. Refresh job list
```

**Delete Job Flow**:
```
1. Click delete icon → Show confirmation dialog
2. Confirm deletion
3. Delete job and all related applications
4. Update database
5. Refresh job list
```

**Backend Delete Processing**:
```javascript
// Verify job ownership
const job = await Job.findById(id)
if (job.companyId.toString() !== companyId.toString()) {
    return res.json({ success: false, message: 'Unauthorized' })
}

// Delete all applications for this job
await JobApplication.deleteMany({ jobId: id })

// Delete the job
await Job.findByIdAndDelete(id)
```

#### 3.3 View Applications
**Endpoint**: `GET /api/company/applicants`

**Features**:
- View all applications across all jobs
- Filter by job, status, match score
- View candidate profiles and resumes
- Change application status
- Delete applications
- Generate analytics for unprocessed applications

**Application Data Structure**:
```javascript
{
    _id: "application_id",
    userId: { name, email, resume, image },
    jobId: { title, location, category, level, salary },
    status: "Pending" | "Accepted" | "Rejected",
    date: timestamp,
    matchAnalytics: {
        overallMatch: 0-100,
        skillsMatch: 0-100,
        experienceMatch: 0-100,
        educationMatch: 0-100,
        analysisDate: Date
    },
    customAnswers: [{ questionId, question, answer }]
}
```

**Status Change Flow**:
```javascript
const changeStatus = async (applicationId, newStatus) => {
    const { data } = await axios.post('/api/company/change-status', {
        id: applicationId,
        status: newStatus
    })
    
    if (data.success) {
        // Send email notification to candidate
        await sendApplicationStatusEmail(
            candidate.email, candidate.name, jobTitle, companyName, newStatus
        )
        toast.success('Status updated')
        fetchApplications()
    }
}
```

**Analytics Generation**:
```javascript
// Only process applications that truly need analytics
const applicationsNeedingAnalytics = await JobApplication.find({
    companyId,
    $or: [
        { matchAnalytics: { $exists: false } },
        { matchAnalytics: null },
        { 'matchAnalytics.analysisDate': { $exists: false } }
    ]
})

// Process each application with rate limiting
for (const application of applicationsNeedingAnalytics) {
    // AI analysis with retry mechanism
    const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt)
    })
    
    // Update application with analytics
    await JobApplication.findByIdAndUpdate(application._id, {
        matchAnalytics: createAnalyticsObject(matchData)
    })
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
}
```

---

## Candidate Side Flow

### 1. Candidate Authentication (Clerk Integration)

#### 1.1 Registration Process
**Flow**:
```
1. Visit registration page
2. Choose registration method:
   - Email/Password
   - Google OAuth
   - GitHub OAuth
3. Complete Clerk registration flow
4. Redirect to profile setup
```

**Clerk Integration**:
```javascript
import { useAuth, useUser } from "@clerk/clerk-react"

const { getToken } = useAuth()
const { user } = useUser()

// Get authentication token for API calls
const token = await getToken()
```

#### 1.2 Profile Management
**Endpoint**: `POST /api/users/update-resume`

**Profile Fields**:
- Name (from Clerk)
- Email (from Clerk)
- Resume (PDF upload)
- Profile image (from Clerk)

**Resume Upload Flow**:
```javascript
const updateResume = async (file) => {
    const formData = new FormData()
    formData.append('resume', file)
    
    const { data } = await axios.post('/api/users/update-resume', formData, {
        headers: { Authorization: `Bearer ${token}` }
    })
    
    if (data.success) {
        toast.success('Resume updated successfully')
        fetchUserData()
    }
}
```

**Backend Resume Processing**:
```javascript
// Upload to Cloudinary
const resumeUpload = await cloudinary.uploader.upload(resumeFile.path, {
    resource_type: 'raw',
    format: 'pdf'
})

// Update user record
await User.findByIdAndUpdate(userId, {
    resume: resumeUpload.secure_url
})
```
### 2. Job Discovery & Application

#### 2.1 Browse Jobs
**Endpoint**: `GET /api/jobs`

**Job Filtering Logic**:
```javascript
// Backend filtering
const currentDate = new Date()
const jobs = await Job.find({ visible: true })
    .populate({path: 'companyId', select: '-password'})

const availableJobs = jobs.filter(job => {
    // Check if job has expired
    if (job.expiryDate && new Date(job.expiryDate) < currentDate) {
        return false
    }
    // Check if max applications reached
    if (job.maxApplications && job.applicationCount >= job.maxApplications) {
        return false
    }
    return true
})
```

**Frontend Job Display**:
- Job cards with company info
- Salary, location, experience level
- Application count and status
- "Apply Now" button (if not already applied)

#### 2.2 Job Application Process
**Endpoint**: `POST /api/users/apply`

**Application Flow**:
```
1. Click "Apply Now" button
2. Check if already applied
3. Validate job availability (not expired, under max applications)
4. Show custom questions (if any)
5. Show resume selection modal
6. Process application with AI analysis
7. Show result (success/rejection with suggestions)
```

**Pre-Application Validations**:
```javascript
// Check if user is logged in
if (!userData) {
    return toast.error("Please login to apply for this job")
}

// Check if already applied
const isAlreadyApplied = await JobApplication.find({ jobId, userId })
if (isAlreadyApplied.length > 0) {
    return res.json({ success: false, message: 'Already applied' })
}

// Check job availability
if (jobData.expiryDate && new Date(jobData.expiryDate) < new Date()) {
    return res.json({ success: false, message: 'This job posting has expired' })
}

if (jobData.maxApplications && jobData.applicationCount >= jobData.maxApplications) {
    return res.json({ success: false, message: 'Maximum applications reached' })
}

// Check if user has resume
if (!user.resume) {
    return res.json({ success: false, message: 'Please upload a resume first' })
}
```

**Custom Questions Handling**:
```javascript
// Frontend validation
if (JobData.customQuestions && JobData.customQuestions.length > 0) {
    for (let i = 0; i < JobData.customQuestions.length; i++) {
        const question = JobData.customQuestions[i]
        if (question.required && (!customAnswers[i] || customAnswers[i].trim() === '')) {
            return toast.error(`Please answer: ${question.question}`)
        }
    }
}

// Format answers for submission
const formattedAnswers = JobData.customQuestions ? JobData.customQuestions.map((question, index) => ({
    questionId: index.toString(),
    question: question.question,
    answer: customAnswers[index] || ''
})) : []
```

**Resume Selection Options**:
```javascript
// Option 1: Use default resume
if (useDefaultResume && !userData.resume) {
    return toast.error("You don't have a default resume. Please upload one.")
}

// Option 2: Upload new resume for this application
if (!useDefaultResume && selectedResume) {
    const formData = new FormData()
    formData.append('resume', selectedResume)
    
    const uploadResponse = await axios.post('/api/users/update-resume', formData, {
        headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!uploadResponse.data.success) {
        return toast.error("Failed to upload resume")
    }
}
```

#### 2.3 AI Resume Analysis
**Process Flow**:
```
1. Extract text from PDF resume
2. Generate AI analysis prompt
3. Call Google Gemini API with retry mechanism
4. Parse AI response for match scores
5. Determine application outcome
6. Generate learning suggestions (if rejected)
7. Create application record
8. Send confirmation email
```

**Resume Text Extraction**:
```javascript
// Fetch resume from Cloudinary
const response = await axios.get(user.resume, { 
    responseType: 'arraybuffer',
    timeout: 10000
})

// Parse PDF content
const pdfBuffer = Buffer.from(response.data)
const resumeData = await pdfParse(pdfBuffer)
const resumeText = resumeData.text
```

**AI Analysis Prompt**:
```javascript
const prompt = `Analyze this candidate's resume against the following job description and provide detailed matching scores.

Job Description:
${jobData.description}

Resume:
${resumeText}

Provide ONLY a JSON response with the following structure:
{
  "overallMatch": integer from 0-100,
  "skillsMatch": integer from 0-100 (technical skills alignment),
  "experienceMatch": integer from 0-100 (years and type of experience),
  "educationMatch": integer from 0-100 (degree and certifications alignment)
}

Do not include any other text or explanation.`
```

**Match Score Processing**:
```javascript
const result = await retryWithBackoff(async () => {
    return await model.generateContent(prompt)
})

const responseText = result.response.text()
const cleanJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
const matchData = JSON.parse(cleanJsonText)

overallMatch = matchData.overallMatch
skillsMatch = matchData.skillsMatch
experienceMatch = matchData.experienceMatch
educationMatch = matchData.educationMatch
```

**Application Outcome Logic**:
```javascript
if (overallMatch < 50) {
    // Generate learning suggestions
    const suggestionPrompt = `Based on the following job description and resume analysis, provide specific learning suggestions...`
    
    const suggestionResult = await retryWithBackoff(async () => {
        return await model.generateContent(suggestionPrompt)
    })
    
    const suggestions = JSON.parse(cleanSuggestionJson)
    
    return res.json({
        success: false,
        message: "Unfortunately, your profile does not meet the necessary qualifications...",
        matchPercentage: overallMatch,
        suggestions: suggestions.suggestions
    })
} else {
    // Create successful application
    await JobApplication.create({
        companyId: jobData.companyId,
        userId,
        jobId,
        date: Date.now(),
        matchAnalytics: {
            overallMatch, skillsMatch, experienceMatch, educationMatch,
            analysisDate: new Date()
        },
        customAnswers: formattedAnswers
    })
    
    // Increment application count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } })
    
    // Send confirmation email
    await sendApplicationConfirmation(user.email, user.name, jobData.title, companyName)
    
    return res.json({ success: true, message: 'Applied Successfully' })
}
```
### 3. Application Management

#### 3.1 View Applied Jobs
**Endpoint**: `GET /api/users/applied-jobs`

**Application Status Tracking**:
```javascript
// Application statuses
const statuses = {
    'Pending': { color: 'yellow', message: 'Under review' },
    'Accepted': { color: 'green', message: 'Congratulations! You got the job' },
    'Rejected': { color: 'red', message: 'Application not selected' }
}
```

**Application Data Display**:
- Job title and company
- Application date
- Current status
- Match percentage (if available)
- Learning suggestions (if rejected)

#### 3.2 Company Following
**Endpoints**: 
- `POST /api/users/follow-company`
- `POST /api/users/unfollow-company`
- `GET /api/users/followed-companies`

**Follow/Unfollow Flow**:
```javascript
const toggleFollow = async (companyId) => {
    const endpoint = isFollowing ? '/api/users/unfollow-company' : '/api/users/follow-company'
    
    const { data } = await axios.post(endpoint, { companyId }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    
    if (data.success) {
        setIsFollowing(!isFollowing)
        toast.success(data.message)
    }
}
```

**Backend Follow Processing**:
```javascript
// Check if already following
const existingFollow = await CompanyFollower.findOne({ userId, companyId })

if (action === 'follow') {
    if (existingFollow) {
        // Reactivate if previously unfollowed
        existingFollow.isActive = true
        await existingFollow.save()
    } else {
        // Create new follow relationship
        await CompanyFollower.create({ userId, companyId, isActive: true })
    }
} else {
    // Unfollow - set inactive instead of deleting
    if (existingFollow) {
        existingFollow.isActive = false
        await existingFollow.save()
    }
}
```

#### 3.3 Job Saving
**Endpoints**:
- `POST /api/users/save-job`
- `POST /api/users/unsave-job`
- `GET /api/users/saved-jobs`

**Save/Unsave Logic**:
```javascript
const toggleSaveJob = async (jobId) => {
    const endpoint = isSaved ? '/api/users/unsave-job' : '/api/users/save-job'
    
    const { data } = await axios.post(endpoint, { jobId }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    
    if (data.success) {
        setIsSaved(!isSaved)
        toast.success(data.message)
    }
}
```

---

## AI Analytics System

### 1. Resume Analysis Pipeline

#### 1.1 Text Extraction
```javascript
// PDF parsing with error handling
try {
    const response = await axios.get(resumeUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: { 'User-Agent': 'Job-Portal-Server/1.0' }
    })
    
    const pdfBuffer = Buffer.from(response.data)
    const resumeData = await pdfParse(pdfBuffer)
    const resumeText = resumeData.text
} catch (error) {
    if (error.response?.status === 401) {
        return { error: 'Resume access restricted. Please re-upload.' }
    } else if (error.response?.status === 404) {
        return { error: 'Resume file not found. Please re-upload.' }
    }
    throw error
}
```

#### 1.2 AI Matching Algorithm
**Scoring Categories**:
- **Overall Match** (0-100): General compatibility
- **Skills Match** (0-100): Technical/domain skills alignment
- **Experience Match** (0-100): Years and type of experience
- **Education Match** (0-100): Degree and certifications alignment

**Prompt Engineering**:
```javascript
const analysisPrompt = `Analyze this candidate's resume against the following job description and provide detailed matching scores.

Job Description:
${jobDescription}

Resume:
${resumeText}

Provide ONLY a JSON response with the following structure:
{
  "overallMatch": integer from 0-100,
  "skillsMatch": integer from 0-100 (domain skills alignment),
  "experienceMatch": integer from 0-100 (years and type of experience),
  "educationMatch": integer from 0-100 (degree and certifications alignment)
}

Do not include any other text or explanation.`
```

#### 1.3 Learning Suggestions Generation
**Trigger Condition**: `overallMatch < 50`

**Suggestion Categories**:
1. **Domain Skills** - Specific knowledge areas to develop
2. **Certifications** - Industry credentials to pursue
3. **Online Courses** - Learning platforms and courses
4. **Projects** - Hands-on experience to build
5. **Experience Areas** - Types of work experience to focus on

**Suggestion Prompt**:
```javascript
const suggestionPrompt = `Based on the following job description and resume analysis, provide specific learning suggestions to help the candidate become eligible for this role.

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Resume Content: ${resumeText}
Match Percentage: ${overallMatch}%

Provide 5-7 specific, actionable learning suggestions including:
1. Domain skills to develop
2. Certifications to pursue
3. Online courses or platforms to use
4. Projects to build
5. Experience areas to focus on

Format as a JSON object with this structure:
{
  "suggestions": [
    {
      "category": "Domain Skills",
      "title": "Learn [Specific Skill/Knowledge Area]",
      "description": "Brief description of why this is important for this role",
      "resources": ["Resource 1", "Resource 2"]
    }
  ]
}

Note: For domain skills, focus on the specific knowledge, tools, methodologies, or competencies required for this particular field or role, whether technical or non-technical.

Provide ONLY the JSON response, no other text.`
```

### 2. Analytics Processing Optimization

#### 2.1 Smart Analytics Detection
```javascript
// Only process applications that truly need analytics
const needsAnalytics = (application) => {
    if (!application.matchAnalytics) return true
    if (!application.matchAnalytics.analysisDate) return true
    
    const hasValidAnalytics = 
        typeof application.matchAnalytics.overallMatch === 'number' &&
        typeof application.matchAnalytics.skillsMatch === 'number' &&
        typeof application.matchAnalytics.experienceMatch === 'number' &&
        typeof application.matchAnalytics.educationMatch === 'number' &&
        application.matchAnalytics.analysisDate instanceof Date
    
    return !hasValidAnalytics
}
```

#### 2.2 Batch Processing
```javascript
// Process applications with rate limiting
const applicationsNeedingAnalytics = await getApplicationsNeedingAnalytics(companyId)

for (const application of applicationsNeedingAnalytics) {
    try {
        // AI analysis with retry mechanism
        const result = await retryWithBackoff(async () => {
            return await model.generateContent(prompt)
        })
        
        // Update application
        await JobApplication.findByIdAndUpdate(application._id, {
            matchAnalytics: createAnalyticsObject(matchData)
        })
        
        processed++
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
    } catch (error) {
        if (error.message?.startsWith('RATE_LIMIT_EXCEEDED:')) {
            console.log('Rate limit hit, stopping batch processing')
            break
        }
        errors++
    }
}
```

---

## Rate Limiting & Error Handling

### 1. Google Gemini API Limits
**Free Tier Quotas**:
- 15 requests per minute (RPM)
- 1 million tokens per minute
- 1,500 requests per day

**Reset Schedule**:
- Per-minute quotas: Every 60 seconds (rolling window)
- Daily quotas: Midnight UTC

### 2. Rate Limiting Implementation

#### 2.1 Retry with Exponential Backoff
```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            if (error.status === 429) {
                const retryAfter = error.errorDetails?.find(detail => 
                    detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
                )?.retryDelay || '20s'
                
                const waitTime = parseRetryDelay(retryAfter)
                
                if (attempt === maxRetries) {
                    throw new Error(`RATE_LIMIT_EXCEEDED:${waitTime}`)
                }
                
                console.log(`Rate limit hit. Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
                continue
            }
            throw error
        }
    }
}
```

#### 2.2 Frontend Rate Limit Handling
```javascript
// Rate limit notification component
const RateLimitNotification = ({ rateLimitInfo, onRetry, onClose }) => {
    const [countdown, setCountdown] = useState(rateLimitInfo?.retryAfter || 0)
    
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev <= 1 ? 0 : prev - 1)
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [countdown])
    
    // Display countdown and retry button
}
```

#### 2.3 Quota Monitoring
```javascript
// Real-time quota status
const QuotaStatusCard = () => {
    const [quotaStatus, setQuotaStatus] = useState(null)
    
    const fetchQuotaStatus = async () => {
        const { data } = await axios.get('/api/company/quota-status')
        if (data.success) {
            setQuotaStatus(data)
        }
    }
    
    useEffect(() => {
        fetchQuotaStatus()
        const interval = setInterval(fetchQuotaStatus, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])
    
    // Display quota usage with visual indicators
}
```
### 3. Error Scenarios & Handling

#### 3.1 Application Process Errors
**Resume Access Errors**:
```javascript
// Cloudinary access issues
if (error.response?.status === 401) {
    return res.json({ 
        success: false, 
        message: 'Resume is restricted. Please re-upload your resume and try again.' 
    })
} else if (error.response?.status === 404) {
    return res.json({ 
        success: false, 
        message: 'Resume file not found. Please re-upload your resume.' 
    })
}
```

**AI Analysis Errors**:
```javascript
// Rate limiting
if (error.message?.startsWith('RATE_LIMIT_EXCEEDED:')) {
    const waitTime = error.message.split(':')[1]
    const waitTimeSeconds = Math.ceil(parseInt(waitTime) / 1000)
    
    return res.json({ 
        success: false, 
        message: 'AI analysis temporarily unavailable due to high demand.',
        rateLimitInfo: {
            isRateLimited: true,
            retryAfter: waitTimeSeconds,
            message: `Please wait ${waitTimeSeconds} seconds before trying again.`,
            quotaInfo: {
                dailyLimit: "1,500 requests per day",
                minuteLimit: "15 requests per minute",
                resetTime: "Quotas reset every minute and daily at midnight UTC"
            }
        }
    })
}

// JSON parsing errors
try {
    const matchData = JSON.parse(cleanJsonText)
} catch (parseError) {
    console.error('AI response parsing error:', parseError)
    return res.json({ 
        success: false, 
        message: 'Error processing AI analysis. Please try again.' 
    })
}
```

#### 3.2 Job Management Errors
**Authorization Errors**:
```javascript
// Verify job ownership before edit/delete
const job = await Job.findById(id)
if (!job) {
    return res.json({ success: false, message: 'Job not found' })
}

if (job.companyId.toString() !== companyId.toString()) {
    return res.json({ success: false, message: 'Unauthorized to modify this job' })
}
```

**Validation Errors**:
```javascript
// Frontend validation
if (!title || !description || !location || !salary || !level || !category) {
    return toast.error("Please fill all required fields")
}

if (salary <= 0) {
    return toast.error("Please enter a valid salary")
}

if (maxApplications && maxApplications < 1) {
    return toast.error("Max applications must be at least 1")
}
```

---

## Database Operations

### 1. Data Models

#### 1.1 User Model
```javascript
const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    resume: { type: String }, // Cloudinary URL
    image: { type: String }   // Clerk profile image
})
```

#### 1.2 Company Model
```javascript
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed
    image: { type: String, required: true }     // Cloudinary URL
})
```

#### 1.3 Job Model
```javascript
const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: String, required: true },
    salary: { type: Number, required: true },
    date: { type: Number, required: true },
    visible: { type: Boolean, default: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    expiryDate: { type: Date, default: null },
    maxApplications: { type: Number, default: null },
    applicationCount: { type: Number, default: 0 },
    customQuestions: [{
        question: { type: String, required: true },
        required: { type: Boolean, default: true },
        type: { type: String, enum: ['text', 'textarea', 'select'], default: 'text' },
        options: [String]
    }]
})
```

#### 1.4 JobApplication Model
```javascript
const jobApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    date: { type: Number, required: true },
    matchAnalytics: {
        overallMatch: { type: Number, default: 0 },
        skillsMatch: { type: Number, default: 0 },
        experienceMatch: { type: Number, default: 0 },
        educationMatch: { type: Number, default: 0 },
        analysisDate: { type: Date }
    },
    customAnswers: [{
        questionId: String,
        question: String,
        answer: String
    }]
})
```

### 2. Database Operations

#### 2.1 Application Creation
```javascript
// Create application with analytics
await JobApplication.create({
    companyId: jobData.companyId,
    userId,
    jobId,
    date: Date.now(),
    matchAnalytics: {
        overallMatch,
        skillsMatch,
        experienceMatch,
        educationMatch,
        analysisDate: new Date()
    },
    customAnswers: formattedAnswers
})

// Increment job application count
await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } })
```

#### 2.2 Analytics Queries
```javascript
// Find applications needing analytics
const applicationsNeedingAnalytics = await JobApplication.find({
    companyId,
    $or: [
        { matchAnalytics: { $exists: false } },
        { matchAnalytics: null },
        { 'matchAnalytics.analysisDate': { $exists: false } },
        { 'matchAnalytics.analysisDate': null }
    ]
}).populate('userId', 'name resume')
  .populate('jobId', 'title description')

// Get analytics statistics
const totalApplications = await JobApplication.countDocuments({ companyId })
const withAnalytics = await JobApplication.countDocuments({
    companyId,
    'matchAnalytics.analysisDate': { $exists: true, $ne: null }
})
```

#### 2.3 Job Filtering
```javascript
// Get available jobs (not expired, under max applications)
const jobs = await Job.find({ visible: true })
    .populate({ path: 'companyId', select: '-password' })

const availableJobs = jobs.filter(job => {
    const currentDate = new Date()
    
    // Check expiry
    if (job.expiryDate && new Date(job.expiryDate) < currentDate) {
        return false
    }
    
    // Check max applications
    if (job.maxApplications && job.applicationCount >= job.maxApplications) {
        return false
    }
    
    return true
})
```

---

## Authentication & Security

### 1. Candidate Authentication (Clerk)

#### 1.1 Token Validation
```javascript
// Middleware for protected routes
export const getAuth = (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
        throw new Error('No token provided')
    }
    
    try {
        const decoded = jwt.verify(token, process.env.CLERK_JWT_KEY)
        return { userId: decoded.sub }
    } catch (error) {
        throw new Error('Invalid token')
    }
}
```

#### 1.2 User Data Sync
```javascript
// Sync user data from Clerk
const syncUserData = async (clerkUser) => {
    const existingUser = await User.findOne({ clerkId: clerkUser.id })
    
    if (existingUser) {
        // Update existing user
        existingUser.name = clerkUser.fullName || clerkUser.firstName
        existingUser.email = clerkUser.emailAddresses[0]?.emailAddress
        existingUser.image = clerkUser.imageUrl
        await existingUser.save()
    } else {
        // Create new user
        await User.create({
            clerkId: clerkUser.id,
            name: clerkUser.fullName || clerkUser.firstName,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            image: clerkUser.imageUrl
        })
    }
}
```

### 2. Recruiter Authentication (JWT)

#### 2.1 Token Generation
```javascript
const generateToken = (companyId) => {
    return jwt.sign({ companyId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}
```

#### 2.2 Protected Route Middleware
```javascript
export const protectCompany = async (req, res, next) => {
    try {
        const token = req.headers.token
        
        if (!token) {
            return res.json({ success: false, message: 'Not authorized. Login again' })
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const company = await Company.findById(decoded.companyId).select('-password')
        
        if (!company) {
            return res.json({ success: false, message: 'Company not found' })
        }
        
        req.company = company
        next()
    } catch (error) {
        res.json({ success: false, message: 'Not authorized' })
    }
}
```

### 3. Data Security

#### 3.1 Password Hashing
```javascript
// Registration
const salt = await bcrypt.genSalt(10)
const hashPassword = await bcrypt.hash(password, salt)

// Login verification
const isValidPassword = await bcrypt.compare(password, company.password)
```

#### 3.2 File Upload Security
```javascript
// Cloudinary configuration with security
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
})

// Resume upload with validation
const resumeUpload = await cloudinary.uploader.upload(resumeFile.path, {
    resource_type: 'raw',
    format: 'pdf',
    public_id: `resumes/${userId}_${Date.now()}`,
    access_mode: 'authenticated' // Restrict access
})
```

---

## Email Notification System

### 1. Email Types

#### 1.1 Application Confirmation
```javascript
const sendApplicationConfirmation = async (email, name, jobTitle, companyName) => {
    const subject = `Application Confirmed - ${jobTitle} at ${companyName}`
    const html = `
        <h2>Application Submitted Successfully!</h2>
        <p>Dear ${name},</p>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been submitted successfully.</p>
        <p>We'll notify you once the recruiter reviews your application.</p>
        <p>Best regards,<br>Job Portal Team</p>
    `
    
    return await sendEmail(email, subject, html)
}
```

#### 1.2 Status Update Notifications
```javascript
const sendApplicationStatusEmail = async (email, name, jobTitle, companyName, status) => {
    const subject = `Application Update - ${jobTitle} at ${companyName}`
    
    let message = ''
    if (status === 'Accepted') {
        message = 'Congratulations! Your application has been accepted.'
    } else if (status === 'Rejected') {
        message = 'Unfortunately, your application was not selected for this position.'
    }
    
    const html = `
        <h2>Application Status Update</h2>
        <p>Dear ${name},</p>
        <p>${message}</p>
        <p>Position: <strong>${jobTitle}</strong></p>
        <p>Company: <strong>${companyName}</strong></p>
        <p>Best regards,<br>Job Portal Team</p>
    `
    
    return await sendEmail(email, subject, html)
}
```

#### 1.3 New Job Notifications
```javascript
const sendNewJobNotification = async (email, name, jobTitle, companyName, jobId, location, salary) => {
    const subject = `New Job Alert - ${jobTitle} at ${companyName}`
    const html = `
        <h2>New Job Opportunity!</h2>
        <p>Dear ${name},</p>
        <p>A new job has been posted by <strong>${companyName}</strong> that might interest you:</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0;">
            <h3>${jobTitle}</h3>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Salary:</strong> $${salary.toLocaleString()}</p>
            <a href="${process.env.FRONTEND_URL}/apply-job/${jobId}" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Apply Now
            </a>
        </div>
        <p>Best regards,<br>Job Portal Team</p>
    `
    
    return await sendEmail(email, subject, html)
}
```

---

## Summary

This documentation covers the complete end-to-end flow of the job portal system, including:

### Key Features Covered:
1. **Dual Authentication Systems** - Clerk for candidates, JWT for recruiters
2. **AI-Powered Resume Analysis** - Google Gemini integration with smart matching
3. **Comprehensive Job Management** - CRUD operations with advanced features
4. **Rate Limiting & Error Handling** - Robust API quota management
5. **Real-time Notifications** - Email alerts for all stakeholders
6. **Advanced Analytics** - Smart processing to avoid redundant API calls
7. **Security Measures** - Authentication, authorization, and data protection

### Error Scenarios Handled:
- Authentication failures
- File upload issues
- AI API rate limiting
- Database operation errors
- Network connectivity problems
- Invalid data submissions
- Authorization violations

### Performance Optimizations:
- Smart analytics detection (no reprocessing)
- Batch processing with rate limiting
- Efficient database queries
- Cloudinary integration for file handling
- Real-time quota monitoring

This system provides a complete job portal solution with enterprise-level features, robust error handling, and scalable architecture.