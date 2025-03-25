const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

// Check for connection success
db.on("connected", () => {
    console.log("MongoDB connected successfully");
});

// Check for connection error
db.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});

// Check for disconnection
db.on("disconnected", () => {
    console.log("MongoDB disconnected");
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    age: Number,
    username: String,
    phone: { type: String, required: true },
    notificationPreference: {
        type: String,
        enum: ["sms", "email", "both"], // Only allow these values
        required: true,
    },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hackathon" }]
});

module.exports = mongoose.model("User", userSchema);