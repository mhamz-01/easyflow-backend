const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Thin wrapper around Brevo's transactional email HTTP API (plain fetch, no
// SDK needed). A single HTTPS POST is a much better fit for Vercel
// serverless functions than an SMTP connection — no handshake latency or
// cold-start timeouts. Requires a single verified sender email in Brevo
// (no custom domain needed): BREVO_API_KEY + BREVO_FROM_EMAIL.
const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || "EasyFlow";

  if (!apiKey || !fromEmail) {
    throw new Error(
      "Brevo is not configured: set BREVO_API_KEY and BREVO_FROM_EMAIL",
    );
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Brevo send failed (${response.status}): ${errorBody}`);
  }

  return response.json();
};

module.exports = { sendEmail };
