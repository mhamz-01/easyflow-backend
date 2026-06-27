const resend = require("../lib/email");

const sendAssignmentEmail = async ({
  to,
  itemName,
  itemType,
  assignedBy,
  itemLink,
}) => {
  const itemTypeLabel = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  return resend.emails.send({
    from: `EasyFlow <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject: `You've been assigned to a ${itemType} — "${itemName}"`,
    text: `${assignedBy ?? "Someone"} assigned you to the ${itemType} "${itemName}".\nView it here: ${itemLink}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>You've been assigned to a ${itemType}</h2>
        <p>
          <strong>${assignedBy ?? "Someone"}</strong> assigned you to the
          ${itemType} <strong>"${itemName}"</strong>.
        </p>
        <a
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
          View ${itemTypeLabel}
        </a>
      </div>
    `,
  });
};

module.exports = { sendAssignmentEmail };
