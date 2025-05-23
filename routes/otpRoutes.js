const express = require("express");
const router = express.Router();
const userModel = require("../models/user.models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../utils/generateOtp");
const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const otpStorage = new Map();
const registrationDataStorage = new Map();

router.get("/otp", (req, res) => {
    const phone = req.query.phone;
    if (!phone) {
        return res.status(400).send("Phone number is required.");
    }
    res.render("otp", { phone });
});

router.post("/send-otp", async (req, res) => {
    const { name, email, password, age, username, phone, notificationPreference } = req.body;

    if (!phone) {
        return res.status(400).send("Phone number is required.");
    }

    // Store registration data temporarily
    registrationDataStorage.set(phone, { name, email, password, age, username, notificationPreference });

    const otp = generateOTP();
    otpStorage.set(phone, otp);
    setTimeout(() => otpStorage.delete(phone), 300000); // OTP expires after 5 minutes

    console.log(`Generated OTP for ${phone}: ${otp}`);

    try {
        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
        });

        res.redirect(`/otp?phone=${encodeURIComponent(phone)}`);
    } catch (error) {
        console.error("Error sending OTP:", error.message);
        res.status(500).send("Error sending OTP. Please try again.");
    }
});

router.post("/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required." });
    }

    if (otpStorage.get(phone) === otp) {
        otpStorage.delete(phone);

        const registrationData = registrationDataStorage.get(phone);
        if (!registrationData) {
            return res.status(400).json({ message: "Registration data not found." });
        }

        const { name, email, password, age, username, notificationPreference } = registrationData;
        try {
            let user = await userModel.findOne({ email });

            if (user) {
                return res.status(400).json({ message: "Email already exists" });
            }

            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(password, salt);

            let newUser = await userModel.create({
                name,
                email,
                password: hash,
                age,
                username,
                phone,
                notificationPreference, // Include notificationPreference
            });

            let token = jwt.sign({ email: newUser.email, userid: newUser._id }, process.env.JWT_SECRET);
            res.cookie("token", token, { httpOnly: true });

            registrationDataStorage.delete(phone);

            return res.status(200).json({ message: "OTP verified and registration successful!", redirect: "/profile" });
        } catch (err) {
            console.error("Error registering user:", err);
            return res.status(500).json({ message: "Error registering user" });
        }
    } else {
        return res.status(400).json({ message: "Invalid OTP. Try again!" });
    }
});

module.exports = router;