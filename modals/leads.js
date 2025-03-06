const { DataTypes, Model} = require('sequelize');
const sequelize = require('../config/connection');

class Leads extends Model {};

Leads.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        formName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        formData:{
            type: DataTypes.JSON,
            allowNull: false,
        }
    },
    {
        sequelize,
        timestamps: true,
        freezeTableNames: true,
        underscored: true,
        modelName: 'Leads'
    }
)

module.exports = Leads