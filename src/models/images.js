const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("joi");

const imagesModel = new Schema({
    teamId: Joi.number(),
    url: Joi.string(),
    nation: Joi.string(),
    slug: Joi.string(),
});

module.exports = mongoose.model("images", imagesModel);
