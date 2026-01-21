const {
  getAllDocSchema,
  createDocBodySchema,
  validateId,
  updateDocSchema,
} = require("./schema");
const { Document, User } = require("../../database/models");

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
const getAllDocs = async (req, res) => {
  try {
    // Validate & transform
    const validatedData = getAllDocSchema.parse(req.query);
    const { projectId, workspaceId } = validatedData;
    // Fetch docs from database (replace with your ORM/Sequelize call)
    const docs = await Document.findAll({
      where: { projectId, workspaceId },
      attributes: ["id", "documentName", "assignees"],
    });
    res.status(200).json({
      success: true,
      docs,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      error: error.message || "Invalid request",
    });
  }
};

const createDoc = async (req, res) => {
  try {
    console.log("req.body", req.body);
    // validate body data
    const { workspaceId, projectId, createdBy } = createDocBodySchema.parse(
      req.body
    );

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

module.exports = { getAllDocs, createDoc, getSingleDoc, updateDoc, deleteDoc };
