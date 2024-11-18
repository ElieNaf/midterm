module.exports = (sequelize, DataTypes) => {
    const WhiteboardContent = sequelize.define('WhiteboardContent', {
      contentID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sessionID: {
        type: DataTypes.INTEGER,
        references: {
          model: 'WhiteboardSessions',
          key: 'sessionID',
        },
        allowNull: false,
      },
      contentType: {
        type: DataTypes.STRING,
        allowNull: false,  // e.g., 'drawing', 'text', 'shape'
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false,  // Can store drawing coordinates, text, image paths, etc.
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
    
    return WhiteboardContent;
  };
  