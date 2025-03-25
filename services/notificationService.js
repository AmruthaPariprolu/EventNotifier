require("dotenv").config();
const twilio = require("twilio");
const mongoose = require("mongoose");
const Hackathon = require("../models/post.models");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Debug: Log environment variables
console.log("Twilio Phone Number:", process.env.TWILIO_PHONE_NUMBER);

// Function to send SMS
const sendSMS = async (to, message) => {
    try {
        const response = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to,
        });
        console.log("✅ SMS sent:", response.sid);
    } catch (error) {
        console.error("❌ Error sending SMS:", error.message);
    }
};

const checkAndSendNotifications = async () => {
    try {
        const now = new Date();
        const hackathons = await Hackathon.find({
            "notifications.isSent": false, 
            "notifications.scheduledTime": { $lte: now }  // Find events where the scheduled time has passed
        });

        for (let hackathon of hackathons) {
            for (let notification of hackathon.notifications) {
                if (!notification.isSent && new Date(notification.scheduledTime) <= now) {
                    const message = `Reminder: Your hackathon '${hackathon.name}' starts at ${hackathon.time} on ${hackathon.date.toDateString()}! 🚀`;

                    // Send SMS
                    try {
                        await sendSMS(notification.phone, message);
                        console.log(`✅ SMS sent to ${notification.phone}`);
                    } catch (error) {
                        console.error(`❌ Error sending SMS to ${notification.phone}:`, error.message);
                    }

                    notification.isSent = true;  // Mark as sent
                }
            }
            await hackathon.save();  // Save changes
        }
    } catch (error) {
        console.error("❌ Error checking notifications:", error.message);
    }
};

// Export the function
module.exports = { checkAndSendNotifications };