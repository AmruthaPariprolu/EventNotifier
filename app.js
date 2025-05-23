const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// JWT Middleware 
const jwt = require("jsonwebtoken");
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user data to the request
    } catch (err) {
      // Token is invalid/expired; clear it
      res.clearCookie("token");
    }
  }
  next();
});
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

app.get("/", (req, res) => {
    res.render("register"); // Renders views/index.ejs
});


// Start server
app.listen(3000, () => console.log("Server running on port 3000"));