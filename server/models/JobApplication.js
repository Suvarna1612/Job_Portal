import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema({
    userId:{ type:String, ref:'User', required:true},
    companyId:{ type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true},
    jobId:{ type:mongoose.Schema.Types.ObjectId, ref:'Job', required:true},
    status: { type:String, default:'Pending'},
    date: { type:Number,required:true},
    // Enhanced matching analytics
    matchAnalytics: {
        overallMatch: { type: Number, default: 0 }, // 0-100
        skillsMatch: { type: Number, default: 0 },  // 0-100
        experienceMatch: { type: Number, default: 0 }, // 0-100
        educationMatch: { type: Number, default: 0 }, // 0-100
        analysisDate: { type: Date, default: Date.now }
    }
})

const JobApplication = mongoose.model('JobApplication',JobApplicationSchema)

export default JobApplication