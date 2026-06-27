// const resend = require("../lib/email");

// const sendWorkspaceInviteEmail = async ({
//   to,
//   inviteLink,
//   role,
//   expiresInDays,
//   workspaceName,
//   createdBy,
// }) => {
//   return resend.emails.send({
//     from: `EasyFlow <${process.env.RESEND_FROM_EMAIL}>`,
//     to,
//     subject: "You've been invited to join a workspace",
//     text: `You've been invited to join ${workspaceName}.\nInvited by: ${createdBy}\nRole: ${role}\nAccept here: ${inviteLink}\n\nThis invite expires in ${expiresInDays} days.`,
//     html: `
//       <div style="font-family: Arial, sans-serif;">
//         <h2>You've been invited</h2>

//         ${
//           workspaceName
//             ? `<p>You've been invited to join <strong>${workspaceName}</strong>.</p>`
//             : `<p>You've been invited to join a workspace.</p>`
//         }

//         ${createdBy ? `<p><strong>Invited by:</strong> ${createdBy}</p>` : ""}

//         <p><strong>Role:</strong> ${role}</p>

//         <a href="${inviteLink}"
//            style="
//              display:inline-block;
//              padding:10px 16px;
//              background:#2563eb;
//              color:#fff;
//              text-decoration:none;
//              border-radius:6px;
//              margin-top:12px;
//            ">
//           Accept Invitation
//         </a>

//         <p style="margin-top:12px;font-size:12px;color:#666;">
//           This invite expires in ${expiresInDays} days.
//         </p>
//       </div>
//     `,
//   });
// };

// module.exports = { sendWorkspaceInviteEmail };
