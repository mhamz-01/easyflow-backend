const transporter = require("../lib/email");

const sendAssignmentEmail = async ({
  to,
  itemName,        // document or whiteboard name
  itemType,        // "document" | "whiteboard"
  assignedBy,
  itemLink,
}) => {
  return transporter.sendMail({
    from: `"EasyFlow" <${process.env.SMTP_USER}>`,
    to,
    subject: `You've been assigned to a ${itemType} — "${itemName}"`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>You've been assigned to a ${itemType}</h2>
        <p>
          <strong>${assignedBy ?? "Someone"}</strong> assigned you to the
          ${itemType} <strong>"${itemName}"</strong>.
        </p>
        
          href="${itemLink}"
          style="
            display:inline-block;
            padding:10px 16px;
            background:#2563eb;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
            margin-top:12px;
          "
        >
          View ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}
        </a>
      </div>
    `,
  });
};

module.exports = { sendAssignmentEmail };