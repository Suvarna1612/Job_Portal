import mongoose from "mongoose";

const SavedJobSchema = new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    savedDate: { type: Date, default: Date.now }
})

// Ensure a user can't save the same job twice
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true })

const SavedJob = mongoose.model('SavedJob', SavedJobSchema)

export default SavedJob