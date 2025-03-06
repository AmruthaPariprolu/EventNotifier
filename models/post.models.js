const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // Store as a string instead of Date
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notifications: [
        {
            phone: { type: String, required: true },  // Ensure phone is required
            message: { type: String, required: true },
            isSent: { type: Boolean, default: false },
            scheduledTime: { type: Date, required: true }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Hackathon", hackathonSchema);
