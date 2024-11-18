module.exports = (sequelize, DataTypes) => {
    const WhiteboardSession = sequelize.define('WhiteboardSession', {
      sessionID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sessionName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roomID: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Rooms',
          key: 'roomID',
        },
        allowNull: false,
      },
      createdByID: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'userID',
        },
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      }
    });
    
    return WhiteboardSession;
  };
  