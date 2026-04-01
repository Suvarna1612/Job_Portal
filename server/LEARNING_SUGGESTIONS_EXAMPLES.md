# Learning Suggestions Examples

## Updated Prompt Structure

The learning suggestions prompt now uses "Domain Skills" instead of "Technical Skills" to be more inclusive of all job types.

### Current Prompt Categories:
1. **Domain skills to develop** - Specific knowledge, tools, methodologies, or competencies for the field
2. **Certifications to pursue** - Industry-recognized credentials
3. **Online courses or platforms to use** - Learning resources and platforms
4. **Projects to build** - Hands-on experience opportunities
5. **Experience areas to focus on** - Types of work experience to gain

## Examples by Job Type

### Technical Job Example (Software Developer)
```json
{
  "suggestions": [
    {
      "category": "Domain Skills",
      "title": "Learn React.js and Node.js",
      "description": "Essential for full-stack JavaScript development in modern web applications",
      "resources": ["React Official Documentation", "Node.js Guides", "freeCodeCamp"]
    },
    {
      "category": "Certifications",
      "title": "AWS Certified Developer Associate",
      "description": "Required for cloud deployment and infrastructure management",
      "resources": ["AWS Training", "A Cloud Guru", "Linux Academy"]
    },
    {
      "category": "Online Courses",
      "title": "Complete Web Development Bootcamp",
      "description": "Comprehensive coverage of modern web development stack",
      "resources": ["Udemy", "Coursera", "Pluralsight"]
    },
    {
      "category": "Projects",
      "title": "Build a Full-Stack E-commerce Application",
      "description": "Demonstrates end-to-end development skills with real-world complexity",
      "resources": ["GitHub", "Heroku for deployment", "MongoDB Atlas"]
    },
    {
      "category": "Experience Areas",
      "title": "Contribute to Open Source Projects",
      "description": "Gain collaborative development experience and build portfolio",
      "resources": ["GitHub", "GitLab", "Open Source communities"]
    }
  ]
}
```

### Non-Technical Job Example (Marketing Manager)
```json
{
  "suggestions": [
    {
      "category": "Domain Skills",
      "title": "Learn Digital Marketing Analytics and SEO",
      "description": "Essential for measuring campaign effectiveness and improving online visibility",
      "resources": ["Google Analytics Academy", "Moz SEO Learning Center", "HubSpot Academy"]
    },
    {
      "category": "Certifications",
      "title": "Google Ads Certification and Facebook Blueprint",
      "description": "Industry-standard certifications for paid advertising platforms",
      "resources": ["Google Skillshop", "Facebook Blueprint", "Google Partners"]
    },
    {
      "category": "Online Courses",
      "title": "Content Marketing and Social Media Strategy",
      "description": "Build skills in creating engaging content and managing social presence",
      "resources": ["Coursera Marketing Courses", "LinkedIn Learning", "Udemy"]
    },
    {
      "category": "Projects",
      "title": "Create and Execute a Multi-Channel Marketing Campaign",
      "description": "Demonstrate ability to plan, execute, and measure marketing initiatives",
      "resources": ["Mailchimp", "Hootsuite", "Canva for design"]
    },
    {
      "category": "Experience Areas",
      "title": "Manage Social Media for Local Businesses or Non-profits",
      "description": "Gain hands-on experience with real audiences and budget constraints",
      "resources": ["Volunteer Match", "Local Chamber of Commerce", "SCORE mentorship"]
    }
  ]
}
```

### Healthcare Job Example (Registered Nurse)
```json
{
  "suggestions": [
    {
      "category": "Domain Skills",
      "title": "Learn Electronic Health Records (EHR) Systems",
      "description": "Critical for modern healthcare documentation and patient care coordination",
      "resources": ["Epic Training", "Cerner Learning", "HIMSS Education"]
    },
    {
      "category": "Certifications",
      "title": "BLS, ACLS, and Specialty Nursing Certifications",
      "description": "Required certifications for advanced patient care and emergency situations",
      "resources": ["American Heart Association", "AACN Certification", "Nursing specialty boards"]
    },
    {
      "category": "Online Courses",
      "title": "Pharmacology and Pathophysiology Refresher",
      "description": "Update knowledge on drug interactions and disease processes",
      "resources": ["Nursing.com", "RegisteredNursing.org", "Coursera Health Courses"]
    },
    {
      "category": "Projects",
      "title": "Develop Patient Education Materials",
      "description": "Create resources that demonstrate patient communication and education skills",
      "resources": ["Health literacy guidelines", "Patient education databases", "Medical illustration tools"]
    },
    {
      "category": "Experience Areas",
      "title": "Volunteer at Community Health Clinics",
      "description": "Gain experience with diverse patient populations and community health",
      "resources": ["Local health departments", "Free clinics", "Red Cross volunteer opportunities"]
    }
  ]
}
```

### Finance Job Example (Financial Analyst)
```json
{
  "suggestions": [
    {
      "category": "Domain Skills",
      "title": "Master Advanced Excel and Financial Modeling",
      "description": "Essential for data analysis, forecasting, and creating financial models",
      "resources": ["Excel Exposure", "Financial Edge", "Coursera Financial Modeling"]
    },
    {
      "category": "Certifications",
      "title": "CFA Level I or FRM Certification",
      "description": "Industry-recognized credentials for financial analysis and risk management",
      "resources": ["CFA Institute", "GARP FRM Program", "Kaplan Schweser"]
    },
    {
      "category": "Online Courses",
      "title": "Corporate Finance and Valuation Methods",
      "description": "Build expertise in company valuation and investment analysis",
      "resources": ["Wharton Online", "MIT OpenCourseWare", "edX Finance Courses"]
    },
    {
      "category": "Projects",
      "title": "Build a Stock Analysis and Valuation Model",
      "description": "Demonstrate ability to analyze companies and make investment recommendations",
      "resources": ["Yahoo Finance API", "SEC EDGAR database", "Bloomberg Terminal (if available)"]
    },
    {
      "category": "Experience Areas",
      "title": "Participate in Investment Clubs or Case Competitions",
      "description": "Gain practical experience in financial analysis and presentation skills",
      "resources": ["Local investment clubs", "CFA Institute competitions", "University case competitions"]
    }
  ]
}
```

### Sales Job Example (Account Executive)
```json
{
  "suggestions": [
    {
      "category": "Domain Skills",
      "title": "Learn CRM Software and Sales Automation Tools",
      "description": "Essential for managing customer relationships and tracking sales pipeline",
      "resources": ["Salesforce Trailhead", "HubSpot Academy", "Pipedrive University"]
    },
    {
      "category": "Certifications",
      "title": "Salesforce Certified Administrator or HubSpot Sales Certification",
      "description": "Industry-standard certifications for sales technology and methodology",
      "resources": ["Salesforce Trailhead", "HubSpot Academy", "Sales certification programs"]
    },
    {
      "category": "Online Courses",
      "title": "Consultative Selling and Negotiation Skills",
      "description": "Develop advanced selling techniques and negotiation strategies",
      "resources": ["LinkedIn Learning", "Dale Carnegie", "Sandler Training online"]
    },
    {
      "category": "Projects",
      "title": "Create a Complete Sales Presentation and Demo",
      "description": "Demonstrate ability to present solutions and handle objections",
      "resources": ["PowerPoint/Keynote", "Loom for video demos", "Sales presentation templates"]
    },
    {
      "category": "Experience Areas",
      "title": "Practice Cold Calling and Lead Generation",
      "description": "Build confidence in prospecting and initial customer contact",
      "resources": ["Local business directories", "LinkedIn Sales Navigator", "Cold calling scripts"]
    }
  ]
}
```

## Key Benefits of "Domain Skills" Approach

### 1. **Universal Applicability**
- Works for technical jobs (programming, engineering)
- Works for non-technical jobs (marketing, sales, HR)
- Works for specialized fields (healthcare, finance, legal)

### 2. **More Accurate Suggestions**
- **Technical roles**: Focuses on programming languages, tools, frameworks
- **Marketing roles**: Focuses on analytics, content creation, campaign management
- **Healthcare roles**: Focuses on medical procedures, patient care, compliance
- **Finance roles**: Focuses on financial modeling, analysis, regulations

### 3. **Better User Experience**
- Candidates don't feel excluded if they're not in tech
- Suggestions are more relevant to their actual career path
- Covers both hard and soft skills specific to the domain

### 4. **AI Understanding**
- The AI can better contextualize what "domain skills" means for each job
- More nuanced and appropriate suggestions based on job field
- Better alignment between job requirements and learning recommendations

This change makes the learning suggestions feature much more inclusive and valuable for all types of job seekers, not just those in technical fields.