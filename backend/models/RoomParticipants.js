module.exports = (sequelize, DataTypes) => {
  const RoomParticipant = sequelize.define(
    "RoomParticipant",
    {
      participantID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      roomID: {
        type: DataTypes.INTEGER,
        references: {
          model: "Rooms",
          key: "roomID",
        },
        allowNull: false,
      },
      UserID: {
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "UserID",
        },
        allowNull: false,
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: "roomparticipant",
      timestamps: false,
    }
  );

  return RoomParticipant;
};
