const mongoose = require("mongoose");
const { Schema } = mongoose;
const Joi = require("joi");

const englandModel = new Schema(
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
                Joi.object({
                    statistics: Joi.object({
                        rating: Joi.number().precision(2),
                        id: Joi.number(),
                        type: Joi.string(),
                        appearances: Joi.number(),
                    }),
                    player: Joi.object({
                        name: Joi.string().required(),
                        slug: Joi.string(),
                        shortName: Joi.string(),
                        position: Joi.string(),
                        userCount: Joi.number(),
                        id: Joi.number(),
                    }),
                    team: {
                        name: Joi.string(),
                        slug: Joi.string().case("lower"),
                        shortName: Joi.string(),
                        id: Joi.number(),
                    },
                })
            ),
            goals: Joi.array().items(
                Joi.object({
                    statistics: Joi.object({
                        rating: Joi.number().precision(2),
                        id: Joi.number(),
                        type: Joi.string(),
                        appearances: Joi.number(),
                    }),
                    player: Joi.object({
                        name: Joi.string().required(),
                        slug: Joi.string(),
                        shortName: Joi.string(),
                        position: Joi.string(),
                        userCount: Joi.number(),
                        id: Joi.number(),
                    }),
                    team: {
                        name: Joi.string(),
                        slug: Joi.string().case("lower"),
                        shortName: Joi.string(),
                        id: Joi.number(),
                    },
                })
            ),
            assists: Joi.array().items(
                Joi.object({
                    statistics: Joi.object({
                        rating: Joi.number().precision(2),
                        id: Joi.number(),
                        type: Joi.string(),
                        appearances: Joi.number(),
                    }),
                    player: Joi.object({
                        name: Joi.string().required(),
                        slug: Joi.string(),
                        shortName: Joi.string(),
                        position: Joi.string(),
                        userCount: Joi.number(),
                        id: Joi.number(),
                    }),
                    team: {
                        name: Joi.string(),
                        slug: Joi.string().case("lower"),
                        shortName: Joi.string(),
                        id: Joi.number(),
                    },
                })
            ),
            goalsAssistsSum: Joi.array().items(
                Joi.object({
                    statistics: Joi.object({
                        rating: Joi.number().precision(2),
                        id: Joi.number(),
                        type: Joi.string(),
                        appearances: Joi.number(),
                    }),
                    player: Joi.object({
                        name: Joi.string().required(),
                        slug: Joi.string(),
                        shortName: Joi.string(),
                        position: Joi.string(),
                        userCount: Joi.number(),
                        id: Joi.number(),
                    }),
                    team: {
                        name: Joi.string(),
                        slug: Joi.string().case("lower"),
                        shortName: Joi.string(),
                        id: Joi.number(),
                    },
                })
            ),
            penaltyGoals: Joi.array().items(
                Joi.object({
                    statistics: Joi.object({
                        rating: Joi.number().precision(2),
                        id: Joi.number(),
                        type: Joi.string(),
                        appearances: Joi.number(),
                    }),
                    player: Joi.object({
                        name: Joi.string().required(),
                        slug: Joi.string(),
                        shortName: Joi.string(),
                        position: Joi.string(),
                        userCount: Joi.number(),
                        id: Joi.number(),
                    }),
                    team: {
                        name: Joi.string(),
                        slug: Joi.string().case("lower"),
                        shortName: Joi.string(),
                        id: Joi.number(),
                    },
                })
            ),
        }),
        matches: Joi.array().items(
            Joi.array().items(
                Joi.object({
                    roundInfo: Joi.object({
                        round: Joi.number(),
                    }),
                    customId: Joi.string(),
                    status: Joi.object({
                        code: Joi.number(),
                        description: Joi.string(),
                        type: Joi.string(),
                    }),
                    winnerCode: Joi.number(),
                    homeTeam: Joi.object({
                        name: Joi.string(),
                        slug: Joi.string().case("lower"),
                        shortName: Joi.string(),
                        id: Joi.number(),
                    }),
                    awayTeam: Joi.object({
                        name: Joi.string(),
                        slug: Joi.string().case("lower"),
                        shortName: Joi.string(),
                        id: Joi.number(),
                    }),
                    homeScore: Joi.object({
                        current: Joi.number(),
                        display: Joi.number(),
                        period1: Joi.number(),
                        period2: Joi.number(),
                        normaltime: Joi.number(),
                    }),
                    awayScore: Joi.object({
                        current: Joi.number(),
                        display: Joi.number(),
                        period1: Joi.number(),
                        period2: Joi.number(),
                        normaltime: Joi.number(),
                    }),
                    time: {
                        injuryTime1: Joi.number(),
                        injuryTime2: Joi.number(),
                        currentPeriodStartTimestamp: Joi.number(),
                    },
                    changes: {
                        changeTimestamp: Joi.number(),
                    },
                    hasGlobalHighlights: Joi.boolean(),
                    hasEventPlayerStatistics: Joi.boolean(),
                    hasEventPlayerHeatMap: Joi.boolean(),
                    id: Joi.number(),
                    startTimestamp: Joi.number().required(),
                    slug: Joi.string().case("lower"),
                    finalResultOnly: Joi.boolean(),
                })
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
englandModel.pre("save", function (next) {
    console.log(this);
    next();
});

module.exports = mongoose.model("leagues", englandModel);
