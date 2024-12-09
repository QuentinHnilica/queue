const { DataTypes, Model} = require('sequelize');
const sequelize = require('../config/connection');

class Posts extends Model {};


Posts.init(
    {
        PostId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        PostContent:{
            type: DataTypes.TEXT('medium'),
            allowNull: false
        },
        subject:{
            type: DataTypes.STRING,
            allowNull: false
        },
        date: {
            type: DataTypes.STRING,
            allowNull: false
        },
        banner:{
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        sequelize,
        timestamps: false,
        freezeTableNames: true,
        underscored: true,
        modelName: 'Posts',
    }
)

module.exports = Posts;