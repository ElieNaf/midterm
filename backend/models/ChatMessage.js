module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define(
    "ChatMessage",
    {
      messageID: {
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
      senderID: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "userID",
        },
        allowNull: false,
      },
      messageText: {
        type: DataTypes.STRING,
        allowNull: false,
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

  return ChatMessage;
};
