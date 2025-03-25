const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../client")));
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Routes
const authRoutes = require("./routes/authRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const profileRoutes = require("./routes/profileRoutes");
const otpRoutes = require("./routes/otpRoutes");

app.use("/", authRoutes);
app.use("/", hackathonRoutes);
app.use("/", profileRoutes);
app.use("/", otpRoutes);



// Start server
app.listen(3000, () => console.log("Server running on port 3000"));