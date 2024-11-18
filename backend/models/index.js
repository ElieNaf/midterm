const sequelize = require("../database/config");
const { DataTypes } = require("sequelize");

const db = {};

// Import models and initialize each one
db.User = require("./User")(sequelize, DataTypes);
db.Room = require("./Room")(sequelize, DataTypes);
db.RoomParticipant = require("./RoomParticipants")(sequelize, DataTypes);
db.ChatMessage = require("./ChatMessage")(sequelize, DataTypes);
db.WhiteboardContent = require("./WhiteboardContent")(sequelize, DataTypes);
db.WhiteboardPermission = require("./WhiteBoardPermission")(sequelize, DataTypes);
db.WhiteboardSession = require("./WhiteboardSession")(sequelize, DataTypes);

// Room and RoomParticipants
db.Room.hasMany(db.RoomParticipant, { foreignKey: "roomID" });
db.RoomParticipant.belongsTo(db.Room, { foreignKey: "roomID" });

// User and RoomParticipants (many-to-many through RoomParticipants)
db.User.belongsToMany(db.Room, { through: db.RoomParticipant, foreignKey: "UserID" });
db.Room.belongsToMany(db.User, { through: db.RoomParticipant, foreignKey: "roomID" });

// User and ChatMessage (One-to-Many)
db.User.hasMany(db.ChatMessage, { foreignKey: "senderID" });
db.ChatMessage.belongsTo(db.User, { foreignKey: "senderID" });

// WhiteboardSession and WhiteboardContent (One-to-Many)
db.WhiteboardSession.hasMany(db.WhiteboardContent, { foreignKey: "sessionID" });
db.WhiteboardContent.belongsTo(db.WhiteboardSession, { foreignKey: "sessionID" });

// WhiteboardSession and WhiteboardPermission (One-to-Many)
db.WhiteboardSession.hasMany(db.WhiteboardPermission, { foreignKey: "sessionID" });
db.WhiteboardPermission.belongsTo(db.WhiteboardSession, { foreignKey: "sessionID" });

// User and WhiteboardPermission (One-to-Many)
db.User.hasMany(db.WhiteboardPermission, { foreignKey: "userID" });
db.WhiteboardPermission.belongsTo(db.User, { foreignKey: "userID" });

// WhiteboardSession and Room (Newly added)
db.WhiteboardSession.belongsTo(db.Room, { foreignKey: "roomID" });
db.Room.hasMany(db.WhiteboardSession, { foreignKey: "roomID" });

// WhiteboardSession and User (Newly added)
db.WhiteboardSession.belongsTo(db.User, { foreignKey: "createdByID" });
db.User.hasMany(db.WhiteboardSession, { foreignKey: "createdByID" });

db.sequelize = sequelize;

module.exports = db;
