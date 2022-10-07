const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("joi");

const hightLight = new Schema({
    nation: Joi.string(),
    publishedAt: Joi.string(),
    title: Joi.string(),
    videoId: Joi.string(),
    createdAt: {
        type: Date,
    },
});

module.exports = mongoose.model("highlights", hightLight);
