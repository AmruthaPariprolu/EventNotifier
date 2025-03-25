const express = require("express");
const router = express.Router();
const userModel = require("../models/user.models");
const isLoggedIn = require("../middleware/authMiddleware");

router.get("/profile", isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findById(req.user.userid).populate("events");
        if (!user) {
            return res.redirect("/profile");
        }
        res.render("profile", { user });
    } catch (err) {
        console.error("Error loading profile page:", err);
        res.status(500).send("Error loading profile page");
    }
});

module.exports = router;