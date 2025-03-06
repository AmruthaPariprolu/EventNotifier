const mongoose = require("mongoose");

mongoose.connect(`mongodb://127.0.0.1:27017/twilioOtp`, {
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
    username: { type: String, required: true,  trim: true },
    age: { type: Number, min: 0 },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hackathon" }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
