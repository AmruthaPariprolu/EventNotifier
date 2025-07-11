require("dotenv").config();
const mongoose = require("mongoose");
const cron = require("node-cron");
const { checkAndSendNotifications } = require("../services/notificationService.js");


mongoose.connect(process.env.MONGODB_URL).then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));


cron.schedule("*/5 * * * *", async () => {
    console.log(" Running scheduled SMS check...");
    await checkAndSendNotifications();
});
