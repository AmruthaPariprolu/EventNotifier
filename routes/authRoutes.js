const express = require("express");
const router = express.Router();
const userModel = require("../models/user.models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).send("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid email or password");
        }

        const token = jwt.sign({ email: user.email, userid: user._id }, process.env.JWT_SECRET);
        res.cookie("token", token, { httpOnly: true }); //This cookie cannot be accessed by JavaScript running in the browser.

        res.redirect("/profile");
    } catch (err) {
        res.status(500).send("Error logging in");
    }
});

router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

module.exports = router;