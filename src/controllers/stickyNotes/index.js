const { Op } = require("sequelize");
const { StickyNotes } = require("../../database/models");
const {
  paramsSchema,
  bodySchema,
  deleteSchema,
  updateBodySchema,
} = require("./schema");
const { RANDOM_COLORS } = require("../../constants");

/**
 * Get sticky notes (cursor pagination)
 */
const getStickyNotes = async (req, res) => {
  try {
    const { workspaceId, userId } = paramsSchema.parse(req.query);
    const { cursor, limit } = req.query;
    const whereClause = {
      workspaceId: Number(workspaceId),
      userId,
    };
    // assign cursor an 'id' key if we have cursor
    if (cursor) {
      whereClause.id = { [Op.lt]: Number(cursor) };
    }
    const stickyNotes = await StickyNotes.findAll({
      where: whereClause,
      order: [["id", "DESC"]],
      limit,
    });

    const nextCursor =
      stickyNotes.length === limit
        ? stickyNotes[stickyNotes.length - 1].id
        : null;

    res.status(200).json({
      success: true,
      data: stickyNotes,
      nextCursor,
    });
  } catch (error) {
    console.log("errr while fetching notes", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * Create sticky note (empty content)
 */
const createStickyNote = async (req, res) => {
  try {
    // validate req params
    const { workspaceId, userId } = bodySchema.parse(req.body);
    // check if existing sticky notes is not having a null content or if isEmpty:true
    const isStickyNoteEmpty = await StickyNotes.findAll({
      where: { isEmpty: true, workspaceId, userId },
    });
    // if a sticky note is having null content
    if (isStickyNoteEmpty.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A Sticky note with no content already exists",
      });
    }

    // find latest sticky note for this user & workspace
    const latestStickyNote = await StickyNotes.findOne({
      where: { workspaceId, userId },
      order: [["createdAt", "DESC"]],
    });

    // determine bgColor
    let bgColor;

    if (latestStickyNote && latestStickyNote.bgColor) {
      // remove last used color
      const availableColors = RANDOM_COLORS.filter(
        (color) => color !== latestStickyNote.bgColor
      );

      // pick random color from remaining
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      bgColor = availableColors[randomIndex];
    } else {
      // first sticky note
      bgColor = RANDOM_COLORS[0];
    }
    // if no sticky note with null content exists then create a sticky note
    const stickyNote = await StickyNotes.create({
      workspaceId: Number(workspaceId),
      userId,
      isEmpty: true,
      bgColor,
      content: null,
    });
    res.status(201).json({
      success: true,
      stickyNote,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update a sticky note content
 */
const updateStickyNote = async (req, res) => {
  try {
    const { id } = updateBodySchema.parse(req.query);
    const { content, isEmpty } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const stickyNote = await StickyNotes.findByPk(id);
    if (!stickyNote) {
      return res.status(404).json({
        success: false,
        message: "Sticky note not found",
      });
    }

    await stickyNote.update({ content, isEmpty });

    res.status(200).json({
      success: true,
      stickyNote,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete sticky note
 */
const deleteStickyNote = async (req, res) => {
  try {
    const { id, workspaceId, userId } = deleteSchema.parse(req.query);

    const deletedCount = await StickyNotes.destroy({
      where: {
        id,
        workspaceId,
        userId,
      },
    });

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Sticky note not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sticky note deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createStickyNote,
  updateStickyNote,
  getStickyNotes,
  deleteStickyNote,
};
