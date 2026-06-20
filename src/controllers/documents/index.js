const { getAllDocSchema, createDocBodySchema, validateId, updateDocSchema } = require("./schema");
const { Document, User } = require("../../database/models");
const { sendAssignmentEmail } = require("../../services/sendAssignmentEmail");


const getSingleDoc = async (req, res) => {
  // validate query
  const { id } = validateId.parse(req.query);
  // get document
  const document = await Document.findByPk(id);
  // if document does not exist
  if (!document) {
    res.status(404).json({
      success: false,
      message: "Document does not exist",
    });
  }
  // send document in response
  res.status(200).json({
    success: true,
    document,
  });
};

const { extractDocPreview } = require("../../utils/extractDocPreview");

const getAllDocs = async (req, res) => {
  try {
    const { projectId, workspaceId } = getAllDocSchema.parse(req.query);

    const docs = await Document.findAll({
      where: { projectId, workspaceId },
      attributes: [
        "id",
        "documentName",
        "isPrivate",
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

    // collect every assignee id across all docs so we resolve users in one query
    const allAssigneeIds = [
      ...new Set(docs.flatMap((doc) => doc.assignees ?? [])),
    ];

    const assigneeUsers = allAssigneeIds.length
      ? await User.findAll({
          where: { id: allAssigneeIds },
          attributes: ["id", "username", "imageUrl"],
        })
      : [];

    const assigneeMap = new Map(assigneeUsers.map((u) => [u.id, u.toJSON()]));

    const result = docs.map((doc) => {
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
    const { workspaceId, projectId, createdBy, documentName,isPrivate } = createDocBodySchema.parse(req.body);

    // get primary_key for user using 'createdBy'
    const user = await User.findOne({
      where: { clerkId: createdBy },
    });

    // is not user is found
    if (!user) {
      res.status(404).json({
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
  console.log(id, columnName, value);
  // find doc
  const doc = await Document.findByPk(id);

  // send not found response
  if (!doc) {
    res.status(404).json({
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
    console.log("DDDDDDDD", req.query);
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

module.exports = { getAllDocs, createDoc, getSingleDoc, updateDoc, deleteDoc, assignDoc };
