const express = require("express");
const mongoose = require("mongoose");
const userModel = require("./models/user.models");
const hackathonModel = require("./models/post.models");
const app = express();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpStorage = new Map();
const registrationDataStorage = new Map(); // Temporary storage for registration data

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(cookieParser());

require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");

app.use(cors());
app.use(bodyParser.json());
const path = require("path");
app.use(express.static(path.join(__dirname, "../client")));
app.use(cors({ origin: "http://localhost:3000" })); // Update this to match your frontend URL

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Home route
app.get("/", (req, res) => {
    res.render("index");
});

// Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Register page
app.get("/register", (req, res) => {
    res.render("register");
});

// Send OTP and redirect to OTP verification page
app.post("/send-otp", async (req, res) => {
    const { name, email, password, age, username, phone } = req.body;

    if (!phone) {
        return res.status(400).send("Phone number is required.");
    }

    // Store registration data temporarily
    registrationDataStorage.set(phone, { name, email, password, age, username });

    const otp = generateOTP();
    otpStorage.set(phone, otp); // Store OTP in memory
    setTimeout(() => otpStorage.delete(phone), 300000); // OTP expires after 5 minutes

    console.log(`Generated OTP for ${phone}: ${otp}`);

    try {
        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
        });

        // Redirect to the OTP verification page
        res.redirect(`/otp?phone=${encodeURIComponent(phone)}`);
    } catch (error) {
        console.error("Error sending OTP:", error.message);
        res.status(500).send("Error sending OTP. Please try again.");
    }
});

// Render the OTP verification page
app.get("/otp", (req, res) => {
    const phone = req.query.phone;
    if (!phone) {
        return res.status(400).send("Phone number is required.");
    }

    res.render("otp", { phone }); // Render otp.ejs and pass the phone number
});

// Verify OTP and call /register POST internally
app.post("/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required." });
    }

    if (otpStorage.get(phone) === otp) {
        otpStorage.delete(phone); // Clear OTP after successful verification

        // Retrieve registration data
        const registrationData = registrationDataStorage.get(phone);
        if (!registrationData) {
            return res.status(400).json({ message: "Registration data not found." });
        }

        // Call /register POST internally
        const { name, email, password, age, username } = registrationData;
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
                phone
            });

            let token = jwt.sign({ email: newUser.email, userid: newUser._id }, "secret");
            res.cookie("token", token, { httpOnly: true });

            // Clear registration data
            registrationDataStorage.delete(phone);

            // Redirect to profile
            return res.status(200).json({ message: "OTP verified and registration successful!", redirect: "/profile" });
        } catch (err) {
            console.error("Error registering user:", err);
            return res.status(500).json({ message: "Error registering user" });
        }
    } else {
        return res.status(400).json({ message: "Invalid OTP. Try again!" });
    }
});

// Login user and redirect to profile page
app.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;
        let user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).send("Invalid email or password");
        }

        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid email or password");
        }

        let token = jwt.sign({ email: user.email, userid: user._id }, "secret");
        res.cookie("token", token, { httpOnly: true });

        // Redirect to profile page after successful login
        res.redirect("/profile");
    } catch (err) {
        res.status(500).send("Error logging in");
    }
});

// Middleware to check authentication
function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login"); // Redirect if no token
    }

    try {
        let data = jwt.verify(token, "secret");
        req.user = data; // Ensure req.user has userid
        next();
    } catch (error) {
        console.log("Invalid token:", error.message);
        return res.redirect("/login");
    }
}

// Profile page
app.get("/profile", isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findById(req.user.userid).populate("events"); // Fetch user with events
        if (!user) {
            return res.redirect("/profile");
        }
        res.render("profile", { user }); // Render profile page with user data
    } catch (err) {
        console.error("Error loading profile page:", err);
        res.status(500).send("Error loading profile page");
    }
});

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// Create Hackathon Page
app.get("/create-hackathon", isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findById(req.user.userid); // Get logged-in user
        if (!user) {
            return res.redirect("/login");
        }
        res.render("index", { user }); // Render create-hackathon.ejs
    } catch (err) {
        console.error("Error loading create hackathon page:", err);
        res.status(500).send("Error loading create hackathon page");
    }
});

// Create a hackathon and redirect to profile page
app.post("/create-hackathon", isLoggedIn, async (req, res) => {
    try {
        const { name, date, time, description, phones } = req.body;
        const user = await userModel.findById(req.user.userid);

        if (!user) {
            return res.status(404).send("User not found");
        }

        const eventDateTime = new Date(`${date}T${time}:00`);
        const notificationTime = new Date(eventDateTime.getTime() - (30 * 60 * 1000)); // 30 mins before

        const phoneNumbers = phones.split(",").map(p => p.trim()); // Convert comma-separated numbers into array

        const notifications = phoneNumbers.map(phone => ({
            phone,
            message: `Reminder: Your hackathon '${name}' starts at ${time} on ${date}! 🚀`,
            scheduledTime: notificationTime,
            isSent: false // Ensure this field is set
        }));

        const hackathon = await hackathonModel.create({
            name,
            date: eventDateTime,
            time,
            description,
            createdBy: user._id,
            notifications
        });

        user.events.push(hackathon._id);
        await user.save();

        res.redirect("/profile");
    } catch (err) {
        console.error("Error creating hackathon:", err);
        res.status(500).send("Error creating hackathon");
    }
});

// Logout user
app.get("/logout", (req, res) => {
    res.cookie("token", "", { expires: new Date(0) });
    res.redirect("/login");
});

// Route to render the update hackathon form
app.get('/update-hackathon/:id', isLoggedIn, async (req, res) => {
    try {
        const hackathon = await hackathonModel.findById(req.params.id);
        if (!hackathon) {
            return res.status(404).send('Hackathon not found');
        }
        res.render('update-hackathon', { hackathon }); // Render an update form view
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route to handle the update hackathon form submission
app.post('/update-hackathon/:id', isLoggedIn, async (req, res) => {
    try {
        const { name, date, time, description } = req.body;
        const updatedHackathon = await hackathonModel.findByIdAndUpdate(
            req.params.id,
            { name, date, time, description },
            { new: true }
        );
        if (!updatedHackathon) {
            return res.status(404).send('Hackathon not found');
        }
        res.redirect('/profile'); // Redirect back to the profile page
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route to handle the delete hackathon request
app.post('/delete-hackathon/:id', isLoggedIn, async (req, res) => {
    try {
        const deletedHackathon = await hackathonModel.findByIdAndDelete(req.params.id);
        if (!deletedHackathon) {
            return res.status(404).send('Hackathon not found');
        }
        res.redirect('/profile'); // Redirect back to the profile page
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
