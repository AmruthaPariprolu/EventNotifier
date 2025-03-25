const jwt = require("jsonwebtoken");

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }

    try {
        const data = jwt.verify(token, "secret");
        req.user = data;
        next();
    } catch (error) {
        return res.redirect("/login");
    }
}

module.exports = isLoggedIn;