const {
    validateId,
    getAllWhiteboardsSchema,
    updateWhiteboardSchema,
    createWhiteboardBodySchema,
  } = require("./schema");
  const { Whiteboard, User } = require("../../database/models");
  
  const getSingleWhiteboard = async (req, res) => {
    const { id } = validateId.parse(req.query);
    const whiteboard = await Whiteboard.findByPk(id);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: "Whiteboard does not exist",
      });
    }
    return res.status(200).json({
      success: true,
      whiteboard,
    });
  };
  
  const getAllWhiteboards = async (req, res) => {
    try {
      const { projectId, workspaceId } = getAllWhiteboardsSchema.parse(req.query);
      const whiteboards = await Whiteboard.findAll({
        where: { projectId, workspaceId },
        attributes: ["id", "whiteboardName", "assignees"],
      });
      return res.status(200).json({
        success: true,
        whiteboards,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        success: false,
        error: error.message || "Invalid request",
      });
    }
  };
  
  const createWhiteboard = async (req, res) => {
    try {
      const { workspaceId, projectId, createdBy } = createWhiteboardBodySchema.parse(req.body);
  
      const user = await User.findOne({ where: { clerkId: createdBy } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No user found while creating whiteboard",
        });
      }
  
      const createdDoc = await Whiteboard.create({
        workspaceId,
        projectId,
        createdBy: user.id,
        createdDate: Date.now(),
      });
  
      return res.status(200).json({
        message: "Whiteboard created successfully",
        createdDoc,
      });
    } catch (error) {
      console.error("err while creating whiteboard", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  
  const updateWhiteboard = async (req, res) => {
    const { id, columnName, value } = updateWhiteboardSchema.parse(req.body);
    const whiteboard = await Whiteboard.findByPk(id);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        message: "Whiteboard not found",
      });
    }
    const savedWhiteboard = await whiteboard.update({ [columnName]: value });
    return res.status(200).json({
      success: true,
      savedWhiteboard,
    });
  };
  
  const deleteWhiteboard = async (req, res) => {
    try {
      const { id } = validateId.parse(req.query);
      const whiteboard = await Whiteboard.findByPk(id);
      if (!whiteboard) {
        return res.status(404).json({
          success: false,
          message: "Whiteboard not found",
        });
      }
      await whiteboard.destroy();
      return res.status(200).json({
        success: true,
        message: "Whiteboard deleted successfully",
        id,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };
  
  module.exports = {
    getSingleWhiteboard,
    getAllWhiteboards,
    createWhiteboard,
    updateWhiteboard,
    deleteWhiteboard,
  };