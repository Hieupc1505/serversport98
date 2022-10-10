const mongoose = require("mongoose");
const { Schema } = mongoose;
const Joi = require("joi");

const leaguesModel = new Schema(
    {
        tournament: Joi.object({
            name: Joi.string(),
            slug: Joi.string(),
            nation: Joi.string(),
            id: Joi.number(),
        }),
        rows: Joi.array().items(Joi.array().items(Joi.object())),
        topPlayers: Joi.object({
            rating: Joi.array().items(
                Joi.object()
            ),
            goals: Joi.array().items(
                Joi.object()
            ),
            assists: Joi.array().items(
                Joi.object()
            ),
            goalsAssistsSum: Joi.array().items(
                Joi.object()
            ),
            penaltyGoals: Joi.array().items(
                Joi.object()
            ),
        }),
        matches: Joi.array().items(
            Joi.array().items(
                Joi.object()
            )
        ),
        teamEvents: Joi.object(),
        rounds: Joi.object({
            currentRound: Joi.object({
                round: Joi.number(),
            }),
            rounds: Joi.object({
                round: Joi.number(),
            }),
        }),
    },
    {
        timestamps: true,
    }
);

// userSchema.methods.updateOrders = function (orderData) {
//     console.log(this);
// };
// leaguesModel.pre("save", function (next) {
//     console.log(this);
//     next();
// });

module.exports = mongoose.model("leagues", leaguesModel);
