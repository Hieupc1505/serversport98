const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("joi");

const topPlayersModel = new Schema({});

module.exports = mongoose.model("topplayers", topPlayersModel);
