const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/connection');

class EmailBlast extends Model { };

EmailBlast.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'sent' // as all are immediate sends
        },
    },
    {
        sequelize,
        timestamps: true,
        freezeTableNames: true,
        underscored: true,
        modelName: 'EmailBlast'
    }
)

module.exports = EmailBlast