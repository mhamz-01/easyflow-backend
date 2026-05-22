const {
    validateId,
    getAllWhiteboardsSchema,
    updateWhiteboardSchema,
    createWhiteboardBodySchema,
  } = require("./schema");
  const { Whiteboard, User } = require("../../database/models");
  const { sendAssignmentEmail } = require("../../services/sendAssignmentEmail");

  
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
        attributes: ["id", "whiteboardName", "isPrivate", "createdBy", "createdDate", "assignees"],
      });
  
      // enrich assignees with user info
      const enriched = await Promise.all(
        whiteboards.map(async (whiteboard) => {
          const plain = whiteboard.toJSON();
          if (plain.assignees?.length) {
            const assigneeUsers = await User.findAll({
              where: { id: plain.assignees },
              attributes: ["id", "username", "imageUrl"],
            });
            plain.assignees = assigneeUsers;
          } else {
            plain.assignees = [];
          }
          return plain;
        }),
      );
  
      res.status(200).json({ success: true, whiteboards: enriched });
    } catch (error) {
      console.error(error);
      res.status(400).json({ success: false, error: error.message });
    }
  };
  
  const createWhiteboard = async (req, res) => {
    try {
      const { workspaceId, projectId, createdBy,whiteboardName,isPrivate } = createWhiteboardBodySchema.parse(req.body);
  
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
        whiteboardName,
        isPrivate: isPrivate ?? false,
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



  const assignWhiteboard = async (req, res) => {
    try {
      const { whiteboardId, memberIds } = req.body; // memberIds: number[]
  
      if (!whiteboardId || !memberIds?.length) {
        return res.status(400).json({
          success: false,
          message: "whiteboardId and memberIds are required",
        });
      }
  
      // find the whiteboard
      const whiteboard = await Whiteboard.findByPk(whiteboardId);
      if (!whiteboard) {
        return res.status(404).json({ success: false, message: "Whiteboard not found" });
      }
  
      // find assigner
      const assigner = await User.findByPk(whiteboard.createdBy, {
        attributes: ["username"],
      });
  
      // merge with existing assignees — no duplicates
      const existing = whiteboard.assignees ?? [];
      const merged = [...new Set([...existing, ...memberIds])];
      await whiteboard.update({ assignees: merged });
  
      // fetch emails of newly added members only
      const newMemberIds = memberIds.filter((id) => !existing.includes(id));
      const newMembers = await User.findAll({
        where: { id: newMemberIds },
        attributes: ["id", "email", "username"],
      });
  
      // send email to each new assignee
      const whiteboardLink = `${process.env.ORIGIN}/whiteboards/${whiteboardId}`;
      await Promise.all(
        newMembers.map((member) =>
          sendAssignmentEmail({
            to: member.email,
            itemName: whiteboard.whiteboardName,
            itemType: "whiteboard",       // ✅
            assignedBy: assigner?.username ?? "Someone",
            itemLink: `${process.env.ORIGIN}/whiteboards/${whiteboardId}`,
          }),
        ),
      );
  
      return res.status(200).json({
        success: true,
        assignees: merged,
      });
    } catch (error) {
      console.error("Assign whiteboard error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  
  module.exports = {
    getSingleWhiteboard,
    getAllWhiteboards,
    createWhiteboard,
    updateWhiteboard,
    deleteWhiteboard,
    assignWhiteboard
  };