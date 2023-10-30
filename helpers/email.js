const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.NODE_MAILER_HOST,
    port: process.env.NODE_MAILER_PORT,
    secure: process.env.NODE_MAILER_SECURE,
    auth: {
      user: process.env.NODE_MAILER_EMAIL,
      pass: process.env.NODE_MAILER_PASSWORD,
    },
  });
};

const sendEmail = async (recipientEmail, subject, htmlContent) => {
  console.log({
    host: process.env.NODE_MAILER_HOST,
    port: process.env.NODE_MAILER_PORT,
    secure: process.env.NODE_MAILER_SECURE,
    auth: {
      user: process.env.NODE_MAILER_EMAIL,
      pass: process.env.NODE_MAILER_PASSWORD,
    },
  });
  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: "XPOLAND Team <no-reply@xpoland.com>",
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    });
    return { success: info };
  } catch (err) {
    console.error("Error while sending email:", err);
    return { success: false, error: err };
  }
};

module.exports = {
  sendEmail,
};
