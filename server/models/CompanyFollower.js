import mongoose from "mongoose";

const CompanyFollowerSchema = new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    followedDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true } // Allow users to pause notifications
})

// Ensure a user can't follow the same company twice
CompanyFollowerSchema.index({ userId: 1, companyId: 1 }, { unique: true })

const CompanyFollower = mongoose.model('CompanyFollower', CompanyFollowerSchema)

export default CompanyFollower