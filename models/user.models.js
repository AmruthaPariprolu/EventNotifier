const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on("connected", () => {
    console.log("MongoDB connected successfully");
});

db.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

db.on("disconnected", () => {
    console.log("MongoDB disconnected");
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    // age: Number,
    username: String,
    phone: { type: String, required: true },
    notificationPreference: {
        type: String,
        enum: ["sms", "email", "both"],
        required: true,
    },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hackathon" }]
});

module.exports = mongoose.model("User", userSchema);
