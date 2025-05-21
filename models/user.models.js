const mongoose = require('mongoose');
require('dotenv').config();

const dbUrl = process.env.ATLASDB_URL;
const DB_NAME = process.env.DB_NAME;

// Connect to MongoDB
mongoose.connect(dbUrl, {
    dbName: DB_NAME
}).then(() => {
    console.log(`Connected to MongoDB: ${dbUrl}`);
}).catch((err) => {
    console.error(`Error connecting to MongoDB: ${err}`);
});

// Event listeners for connection status
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    age: Number,
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