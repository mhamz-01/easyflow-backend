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
  });

  return PrivateProjectMember;
};
