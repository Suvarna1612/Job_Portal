import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: {type:String, required:true},
    description: {type:String, required:true},
    location: {type:String, required:true},
    category: {type:String, required:true},
    level: {type:String, required:true},
    salary: {type:Number, required:true},
    date: {type:Number, required:true},
    visible: {type:Boolean, default:true},
    companyId: {type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true},
    expiryDate: {type:Date, default:null}, // Optional: Job expiry date
    maxApplications: {type:Number, default:null}, // Optional: Maximum number of applications
    applicationCount: {type:Number, default:0}, // Track number of applications received
})


const Job = mongoose.model('Job',jobSchema)

export default Job