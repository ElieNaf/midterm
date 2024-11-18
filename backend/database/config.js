require("dotenv").config(); // Load environment variables

const { Sequelize } = require("sequelize");

// Use environment variables
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
    }
);

module.exports = sequelize;
