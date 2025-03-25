const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET_KEY;
const redirectUri = process.env.REDIRECT_URI;
const refreshToken = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
oAuth2Client.setCredentials({ refresh_token: refreshToken });

async function sendEmail( to,hackathonDetails) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER, // Your Gmail address
                clientId: clientId,
                clientSecret: clientSecret,
                refreshToken: refreshToken,
                accessToken: accessToken,
            },
            tls: {
                rejectUnauthorized: false, // Disable SSL certificate validation for local development
            },
        });

        const mailOptions = {
            from: 'EVENT NOTIFIER',
            to: to,
            subject: `Hackathon Reminder: ${hackathonDetails.name}`,
            text: `
                Hackathon Details:
                Name: ${hackathonDetails.name}
                Date: ${hackathonDetails.date}
                Time: ${hackathonDetails.time}
                Description: ${hackathonDetails.description}
            `,
        };

        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (err) {
        return err;
    }
}

module.exports = sendEmail;