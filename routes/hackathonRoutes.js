const express = require("express");
const router = express.Router();
const hackathonModel = require("../models/post.models");
const userModel = require("../models/user.models");
const { checkAndSendNotifications } = require("../services/notificationService");
const sendEmail = require("../services/emailService");
const isLoggedIn = require("../middleware/authMiddleware");

// Create Hackathon Page
router.get("/create-hackathon", isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findById(req.user.userid);
        if (!user) return res.redirect("/login");
        res.render("index", { user });
    } catch (err) {
        console.error("Error loading create hackathon page:", err);
        res.status(500).send("Error loading create hackathon page");
    }
});

// Create Hackathon
router.post("/create-hackathon", isLoggedIn, async (req, res) => {
    try {
        const { name, date, time, description, phones } = req.body;
        const user = await userModel.findById(req.user.userid);
        if (!user) return res.status(404).send("User not found");

        const eventDateTime = new Date(`${date}T${time}:00`);
        const smsNotificationTime = new Date(eventDateTime.getTime() - (30 * 60 * 1000));
        const emailNotificationTime = new Date(eventDateTime.getTime() - (3 * 60 * 60 * 1000));

        const phoneNumbers = phones.split(",").map(p => p.trim());

        const notifications = phoneNumbers.map(phone => ({
            phone,
            message: `Reminder: Your hackathon '${name}' starts at ${time} on ${date}! 🚀`,
            scheduledTime: smsNotificationTime,
            isSent: false,
        }));

        const hackathon = await hackathonModel.create({
            name,
            date: eventDateTime,
            time,
            description,
            createdBy: user._id,
            notifications,
        });

        user.events.push(hackathon._id);
        await user.save();

        const hackathonDetails = {
            name,
            date: eventDateTime.toDateString(),
            time,
            description,
        };

        // SMS Notifications
        if (user.notificationPreference === "sms" || user.notificationPreference === "both") {
            await checkAndSendNotifications(phoneNumbers, hackathonDetails);
        }

        // Email Notifications
        if (user.notificationPreference === "email" || user.notificationPreference === "both") {
            const delay = emailNotificationTime - Date.now();
            if (delay > 0) {
                setTimeout(async () => {
                    try {
                        await sendEmail(user.email, hackathonDetails);
                        console.log("Email notification sent successfully!");
                    } catch (err) {
                        console.error("Error sending email notification:", err);
                    }
                }, delay);
            } else {
                console.log("Email notification time has already passed.");
            }
        }

        res.redirect("/profile");
    } catch (err) {
        console.error("Error creating hackathon:", err);
        res.status(500).send("Error creating hackathon");
    }
});

// Update Hackathon Page
router.get('/update-hackathon/:id', isLoggedIn, async (req, res) => {
    try {
        const hackathon = await hackathonModel.findById(req.params.id);
        if (!hackathon) return res.status(404).send('Hackathon not found');
        res.render('update-hackathon', { hackathon });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Update Hackathon
router.post('/update-hackathon/:id', isLoggedIn, async (req, res) => {
    try {
        const { name, date, time, description } = req.body;
        const user = await userModel.findById(req.user.userid);
        if (!user) return res.status(404).send('User not found');

        const eventDateTime = new Date(`${date}T${time}:00`);
        const smsNotificationTime = new Date(eventDateTime.getTime() - (30 * 60 * 1000));
        const emailNotificationTime = new Date(eventDateTime.getTime() - (3 * 60 * 60 * 1000));

        const updatedHackathon = await hackathonModel.findByIdAndUpdate(
            req.params.id,
            { name, date: eventDateTime, time, description },
            { new: true }
        );

        if (!updatedHackathon) return res.status(404).send('Hackathon not found');

        const hackathonDetails = {
            name,
            date: eventDateTime.toDateString(),
            time,
            description,
        };

        const phoneNumbers = updatedHackathon.notifications.map(n => n.phone);

        // SMS Notifications
        if (user.notificationPreference === "sms" || user.notificationPreference === "both") {
            await checkAndSendNotifications(phoneNumbers, hackathonDetails);
        }

        // Email Notifications
        if (user.notificationPreference === "email" || user.notificationPreference === "both") {
            const delay = emailNotificationTime - Date.now();
            if (delay > 0) {
                setTimeout(async () => {
                    try {
                        await sendEmail(user.email, hackathonDetails);
                        console.log("Email notification sent successfully!");
                    } catch (err) {
                        console.error("Error sending email notification:", err);
                    }
                }, delay);
            } else {
                console.log("Email notification time has already passed.");
            }
        }

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Delete Hackathon
router.post('/delete-hackathon/:id', isLoggedIn, async (req, res) => {
    try {
        const deletedHackathon = await hackathonModel.findByIdAndDelete(req.params.id);
        if (!deletedHackathon) return res.status(404).send('Hackathon not found');
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;