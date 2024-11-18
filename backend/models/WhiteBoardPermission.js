module.exports = (sequelize, DataTypes) => {
  const WhiteboardPermission = sequelize.define(
    "WhiteboardPermission",
    {
      permissionID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sessionID: {
        type: DataTypes.INTEGER,
        references: {
          model: "WhiteboardSessions",
          key: "sessionID",
        },
        allowNull: false,
      },
      userID: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "userID",
        },
        allowNull: false,
      },
      permissionLevel: {
        type: DataTypes.STRING,
        allowNull: false, // E.g., 'view', 'edit', 'owner'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      timestamps: false, // Disable automatic createdAt and updatedAt fields
    }
  );

  return WhiteboardPermission;
};
