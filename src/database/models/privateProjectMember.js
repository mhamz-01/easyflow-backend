const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PrivateProjectMember = sequelize.define("PrivateProjectMember", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("active", "removed"),
      allowNull: false,
      defaultValue: "active",
    },

    removedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    removedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  PrivateProjectMember.associate = (models) => {
    PrivateProjectMember.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    PrivateProjectMember.belongsTo(models.User, {
      foreignKey: "removedBy",
      as: "removedByUser",
    });
    PrivateProjectMember.belongsTo(models.User, {
      foreignKey: "invitedBy",
      as: "invitedByUser",
    });
  };

  return PrivateProjectMember;
};
