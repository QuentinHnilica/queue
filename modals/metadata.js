const { DataTypes, Model} = require('sequelize');
const sequelize = require('../config/connection');

class MetaData extends Model {};


MetaData.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        pageName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title:{
            type: DataTypes.STRING,
            allowNull: false
        },
        Keywords:{
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        sequelize,
        timestamps: false,
        freezeTableNames: true,
        underscored: true,
        modelName: 'MetaData',
    }
)

module.exports = MetaData;