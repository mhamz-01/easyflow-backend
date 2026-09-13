const { getAuth } = require("@clerk/express");
const {
  getAllDocSchema,
  createDocBodySchema,
  validateId,
  updateDocSchema,
  grantDocAccessSchema,
  setDefaultAccessSchema,
} = require("./schema");
const { Document, User, DocumentPermission } = require("../../database/models");
const { sendAssignmentEmail } = require("../../services/sendAssignmentEmail");
const { extractDocPreview } = require("../../utils/extractDocPreview");
const { findWorkspaceMemberRole } = require("../../services/auth/workspaceMember");
const { filterDocsByAccess, ADMIN_ROLES } = require("../../services/documentAccess.service");


const getSingleDoc = async (req, res) => {
  // requireDocumentAccess({ fullRow: true }) already loaded this exact row
  // to run the access check — reuse it instead of querying again.
  const document = req.document;
  // send document in response — access is resolved by requireDocumentAccess
  // for public docs; private docs are unaffected by this feature, so they
  // keep behaving exactly as before (always fully editable by anyone who can
  // load them).
  res.status(200).json({
    success: true,
    document,
    access: document.isPrivate ? "edit" : req.documentAccess,
  });
};

const getAllDocs = async (req, res) => {
  try {
    const { projectId, workspaceId } = getAllDocSchema.parse(req.query);
    const numericWorkspaceId = Number(workspaceId);

    // Confirm the requester is actually a member of the workspace being
    // queried (previously unchecked — any authenticated user could list any
    // workspace's docs by passing an arbitrary workspaceId).
    const { userId: clerkId } = getAuth(req);
    const role = await findWorkspaceMemberRole(clerkId, numericWorkspaceId);
    if (!role) {
      return res.status(403).json({ success: false, message: "Not a workspace member" });
    }

    const docs = await Document.findAll({
      where: { projectId, workspaceId },
      attributes: [
        "id",
        "documentName",
        "isPrivate",
        "defaultAccess",
        "createdBy",
        "createdDate",
        "assignees",
        "content",
      ],
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "imageUrl"],
        },
      ],
    });

    // drop any public doc this user's access has been set/left at "none"
    const visibleDocs = await filterDocsByAccess({ docs, userId: req.user.id, role });

    // collect every assignee id across all docs so we resolve users in one query
    const allAssigneeIds = [
      ...new Set(visibleDocs.flatMap((doc) => doc.assignees ?? [])),
    ];

    const assigneeUsers = allAssigneeIds.length
      ? await User.findAll({
          where: { id: allAssigneeIds },
          attributes: ["id", "username", "imageUrl"],
        })
      : [];

    const assigneeMap = new Map(assigneeUsers.map((u) => [u.id, u.toJSON()]));

    const result = visibleDocs.map((doc) => {
      const plain = doc.toJSON();
      return {
        ...plain,
        assignees: (plain.assignees ?? [])
          .map((id) => assigneeMap.get(id))
          .filter(Boolean),
        preview: extractDocPreview(plain.content),
        content: undefined,
      };
    });

    res.status(200).json({ success: true, docs: result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

const createDoc = async (req, res) => {
  try {
    // validate body data
    const { workspaceId, projectId, createdBy, documentName, isPrivate, defaultAccess } =
      createDocBodySchema.parse(req.body);

    // get primary_key for user using 'createdBy'
    const user = await User.findOne({
      where: { clerkId: createdBy },
    });

    // is not user is found
    if (!user) {
      return res.status(404).json({
        message: "No user found while creating document",
        success: false,
      });
    }
    const userPrimaryId = user.id;
    // create doc
    const createdDoc = await Document.create({
      workspaceId,
      projectId,
      createdBy: userPrimaryId,
      documentName,
      isPrivate: isPrivate ?? false,
      defaultAccess: defaultAccess ?? "edit",
      createdDate: Date.now(),
    });

    // send response to client
    res.status(200).json({
      message: "Document created successfully",
      createdDoc,
    });
  } catch (error) {
    console.log("err while creating doc");
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

const updateDoc = async (req, res) => {
  // valiate values
  const { id, columnName, value } = updateDocSchema.parse(req.body);
  // find doc
  const doc = await Document.findByPk(id);

  // send not found response
  if (!doc) {
    return res.status(404).json({
      success: false,
      message: "Document not found",
    });
  }
  // save changes to it
  const savedDoc = await doc.update({ [columnName]: value });
  res.status(200).json({
    success: true,
    savedDoc,
  });
};

const deleteDoc = async (req, res) => {
  try {
    // validate id
    const { id } = validateId.parse(req.query);

    // check if document exists
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // delete document
    await document.destroy();

    // send response
    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      id,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


const assignDoc = async (req, res) => {
  try {
    const { docId, memberIds } = req.body; // memberIds: number[]

    if (!docId || !memberIds?.length) {
      return res.status(400).json({
        success: false,
        message: "docId and memberIds are required",
      });
    }

    // find the doc
    const doc = await Document.findByPk(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // find assigner
    const assigner = await User.findByPk(doc.createdBy, {
      attributes: ["username"],
    });

    // merge with existing assignees — no duplicates
    const existing = doc.assignees ?? [];
    const merged = [...new Set([...existing, ...memberIds])];
    await doc.update({ assignees: merged });

    // fetch emails of newly added members only
    const newMemberIds = memberIds.filter((id) => !existing.includes(id));
    const newMembers = await User.findAll({
      where: { id: newMemberIds },
      attributes: ["id", "email", "username"],
    });

    // send email to each new assignee
    const docLink = `${process.env.ORIGIN}/docs/${docId}`;
    await Promise.all(
      newMembers.map((member) =>
        sendAssignmentEmail({
          to: member.email,
          itemName: doc.documentName,
          itemType: "document",       // ✅
          assignedBy: assigner?.username ?? "Someone",
          itemLink: `${process.env.ORIGIN}/docs/${docId}`,
        }).catch((err) => {
          console.error("Assignment email failed:", err?.message ?? err);
        }),
      ),
    );

    return res.status(200).json({
      success: true,
      assignees: merged,
    });
  } catch (error) {
    console.error("Assign doc error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Access-control management (public documents only) ---

const listDocAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const grants = await DocumentPermission.findAll({
      where: { documentId: id },
      include: [{ model: User, as: "user", attributes: ["id", "username", "imageUrl"] }],
      attributes: ["id", "userId", "accessLevel", "grantedBy"],
    });
    res.status(200).json({ success: true, grants });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const grantDocAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, accessLevel } = grantDocAccessSchema.parse(req.body);

    const document = await Document.findByPk(id, {
      attributes: ["id", "workspaceId", "isPrivate"],
    });
    if (!document || document.workspaceId !== req.workspaceId || document.isPrivate) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    let grant = await DocumentPermission.findOne({ where: { documentId: id, userId } });
    if (grant) {
      await grant.update({ accessLevel, grantedBy: req.user.id });
    } else {
      grant = await DocumentPermission.create({
        documentId: id,
        userId,
        accessLevel,
        grantedBy: req.user.id,
      });
    }

    res.status(200).json({ success: true, grant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const revokeDocAccess = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const document = await Document.findByPk(id, {
      attributes: ["id", "workspaceId", "isPrivate"],
    });
    if (!document || document.workspaceId !== req.workspaceId || document.isPrivate) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    await DocumentPermission.destroy({ where: { documentId: id, userId } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const setDefaultAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { defaultAccess } = setDefaultAccessSchema.parse(req.body);

    const document = await Document.findByPk(id);
    if (!document || document.workspaceId !== req.workspaceId || document.isPrivate) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // The creator can set their own doc's default; beyond that, only
    // admin/owner can change it (req.documentRole is set by the
    // requireDocumentAccess middleware this route runs behind).
    const isCreator = document.createdBy === req.user.id;
    if (!isCreator && !ADMIN_ROLES.includes(req.documentRole)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await document.update({ defaultAccess });
    res.status(200).json({ success: true, document });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllDocs,
  createDoc,
  getSingleDoc,
  updateDoc,
  deleteDoc,
  assignDoc,
  listDocAccess,
  grantDocAccess,
  revokeDocAccess,
  setDefaultAccess,
};
