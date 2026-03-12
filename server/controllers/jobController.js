import Job from "../models/Job.js"



// Get all jobs
export const getJobs = async (req,res) => {
    try {
        const currentDate = new Date()
        
        const jobs = await Job.find({ visible:true })
        .populate({path:'companyId',select:'-password'})

        // Filter jobs based on expiry date and max applications
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

        res.json({success:true, jobs: availableJobs})

    } catch (error) {
        res.json({success:false, message:error.message})
    }
}

// Get a single job by ID
export const getJobById = async (req,res) => {
    try {
        
        const {id} = req.params

        const job = await Job.findById(id)
        .populate({
            path:'companyId',
            select:'-password'
        })

        if (!job) {
            return res.json({
                success:false,
                message:'Job not found'
            })
        }

        res.json({
            success:true,
            job
        })

    } catch (error) {
        res.json({success:false,message:error.message})
    }
}