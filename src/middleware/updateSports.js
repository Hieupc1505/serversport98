const nations = require("../Library/nation.json");
const { default: axios } = require("axios");
const createError = require("http-errors");
const englandsModel = require("../models/englandModel");
const {
    addCharts,
    addTeamEvent,
    addRounds,
    addMatch,
    addTopPlayers,
    getvideoV2,
} = require("../controllers/writeFile");

const updateSport = {
    udCharts: async (req, res, next) => {
        const { nation } = req.params;

        Promise.allSettled([addCharts(nation, req), addTeamEvent(nation, req)])
            .then((result) => {
                next();
            })
            .catch((err) => {
                console.log("err from udCharts");
                next();
            });
    },
    udMatch: async (req, res, next) => {
        const { nation } = req.params;

        try {
            await addRounds(nation, req);

            await addMatch(nation, req.rounds);

            next();
        } catch (err) {
            console.log("have err udMatch");
            next();
        }
    },
    udTopPlayers: async (req, res, next) => {
        const { nation } = req.params;
        try {
            await addTopPlayers(req, nation);
            next();
        } catch (err) {
            console.log("err from udTopPlayers");

            next();
        }
    },
    udList: async (req, res, next) => {
        const { nation } = req.params;
        try {
            await getvideoV2(nation);
            next();
        } catch (err) {
            console.log("err from udList");
            next();
        }
    },
};

module.exports = updateSport;
