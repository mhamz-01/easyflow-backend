const { getAuth } = require("@clerk/express");
const {
    validateId,
    getAllWhiteboardsSchema,
    updateWhiteboardSchema,
    createWhiteboardBodySchema,
    grantWhiteboardAccessSchema,
    setWhiteboardDefaultAccessSchema,
  } = require("./schema");
  const { Whiteboard, User, WhiteboardPermission } = require("../../database/models");
  const { sendAssignmentEmail } = require("../../services/sendAssignmentEmail");
  const { findWorkspaceMemberRole } = require("../../services/auth/workspaceMember");
  const { filterWhiteboardsByAccess, ADMIN_ROLES } = require("../../services/whiteboardAccess.service");


  const getSingleWhiteboard = async (req, res) => {
    // requireWhiteboardAccess({ fullRow: true }) already loaded this exact
    // row to run the access check — reuse it instead of querying again.
    const whiteboard = req.whiteboard;
    // send whiteboard in response — access is resolved by
    // requireWhiteboardAccess for public whiteboards; private whiteboards
    // are unaffected by this feature, so they keep behaving exactly as
    // before (always fully editable by anyone who can load them).
    return res.status(200).json({
      success: true,
      whiteboard,
      access: whiteboard.isPrivate ? "edit" : req.whiteboardAccess,
    });
  };

  const getAllWhiteboards = async (req, res) => {
    try {
      const { projectId, workspaceId } = getAllWhiteboardsSchema.parse(req.query);
      const numericWorkspaceId = Number(workspaceId);

      // Confirm the requester is actually a member of the workspace being
      // queried (previously unchecked — any authenticated user could list
      // any workspace's whiteboards by passing an arbitrary workspaceId).
      const { userId: clerkId } = getAuth(req);
      const role = await findWorkspaceMemberRole(clerkId, numericWorkspaceId);
      if (!role) {
        return res.status(403).json({ success: false, message: "Not a workspace member" });
      }

      const whiteboards = await Whiteboard.findAll({
        where: { projectId, workspaceId },
        attributes: ["id", "whiteboardName", "isPrivate", "defaultAccess", "createdBy", "createdDate", "assignees"],
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "username", "imageUrl"],
          },
        ],
      });

      // drop any public whiteboard this user's access has been set/left at "none"
      const visibleWhiteboards = await filterWhiteboardsByAccess({ whiteboards, userId: req.user.id, role });

      // collect every assignee id across all whiteboards so we resolve users in one query
      const allAssigneeIds = [
        ...new Set(visibleWhiteboards.flatMap((whiteboard) => whiteboard.assignees ?? [])),
      ];

      const assigneeUsers = allAssigneeIds.length
        ? await User.findAll({
            where: { id: allAssigneeIds },
            attributes: ["id", "username", "imageUrl"],
          })
        : [];

      const assigneeMap = new Map(assigneeUsers.map((u) => [u.id, u.toJSON()]));

      const result = visibleWhiteboards.map((whiteboard) => {
        const plain = whiteboard.toJSON();
        return {
          ...plain,
          assignees: (plain.assignees ?? [])
            .map((id) => assigneeMap.get(id))
            .filter(Boolean),
        };
      });

      res.status(200).json({ success: true, whiteboards: result });
    } catch (error) {
      console.error(error);
      res.status(400).json({ success: false, error: error.message });
    }
  };

  const createWhiteboard = async (req, res) => {
    try {
      const { workspaceId, projectId, createdBy,whiteboardName,isPrivate, defaultAccess } = createWhiteboardBodySchema.parse(req.body);

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
        defaultAccess: defaultAccess ?? "edit",
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
      console.error("Assign whiteboard error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  
  // --- Access-control management (public whiteboards only) ---

  const listWhiteboardAccess = async (req, res) => {
    try {
      const { id } = req.params;
      const grants = await WhiteboardPermission.findAll({
        where: { whiteboardId: id },
        include: [{ model: User, as: "user", attributes: ["id", "username", "imageUrl"] }],
        attributes: ["id", "userId", "accessLevel", "grantedBy"],
      });
      res.status(200).json({ success: true, grants });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  const grantWhiteboardAccess = async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, accessLevel } = grantWhiteboardAccessSchema.parse(req.body);

      const whiteboard = await Whiteboard.findByPk(id, {
        attributes: ["id", "workspaceId", "isPrivate"],
      });
      if (!whiteboard || whiteboard.workspaceId !== req.workspaceId || whiteboard.isPrivate) {
        return res.status(404).json({ success: false, message: "Whiteboard not found" });
      }

      let grant = await WhiteboardPermission.findOne({ where: { whiteboardId: id, userId } });
      if (grant) {
        await grant.update({ accessLevel, grantedBy: req.user.id });
      } else {
        grant = await WhiteboardPermission.create({
          whiteboardId: id,
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

  const revokeWhiteboardAccess = async (req, res) => {
    try {
      const { id, userId } = req.params;

      const whiteboard = await Whiteboard.findByPk(id, {
        attributes: ["id", "workspaceId", "isPrivate"],
      });
      if (!whiteboard || whiteboard.workspaceId !== req.workspaceId || whiteboard.isPrivate) {
        return res.status(404).json({ success: false, message: "Whiteboard not found" });
      }

      await WhiteboardPermission.destroy({ where: { whiteboardId: id, userId } });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  const setWhiteboardDefaultAccess = async (req, res) => {
    try {
      const { id } = req.params;
      const { defaultAccess } = setWhiteboardDefaultAccessSchema.parse(req.body);

      const whiteboard = await Whiteboard.findByPk(id);
      if (!whiteboard || whiteboard.workspaceId !== req.workspaceId || whiteboard.isPrivate) {
        return res.status(404).json({ success: false, message: "Whiteboard not found" });
      }

      // The creator can set their own whiteboard's default; beyond that,
      // only admin/owner can change it (req.whiteboardRole is set by the
      // requireWhiteboardAccess middleware this route runs behind).
      const isCreator = whiteboard.createdBy === req.user.id;
      if (!isCreator && !ADMIN_ROLES.includes(req.whiteboardRole)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      await whiteboard.update({ defaultAccess });
      res.status(200).json({ success: true, whiteboard });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  module.exports = {
    getSingleWhiteboard,
    getAllWhiteboards,
    createWhiteboard,
    updateWhiteboard,
    deleteWhiteboard,
    assignWhiteboard,
    listWhiteboardAccess,
    grantWhiteboardAccess,
    revokeWhiteboardAccess,
    setWhiteboardDefaultAccess,
  };