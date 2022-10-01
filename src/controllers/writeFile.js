const axios = require("axios");
const fs = require("fs");
const path = require("path");
const englandsModel = require("../models/englandModel");
const nations = require("../Library/nation.json");

const checkNation = async (nation, s = 0) => {
    // const idNation , idSeason
    const { params, seasons } = nations[nation];
    return {
        idNation: params.id,
        season: { year: seasons[s].year, id: seasons[s].id },
    };
};
const getRequest = async (url) => {
    return await axios.get(url).then((resp) => resp.data);
};

class writeFile {
    async getMatch(req, res, next) {
        // const { data } = await axios.get(
        //     "https://api.sofascore.com/api/v1/unique-tournament/17/season/41886/events/round/6"
        // );
        // fs.writeFile(
        //     path.join(__dirname, "../Library", "england.json"),
        //     JSON.stringify(data),
        //     function (err) {
        //         if (err) console.log(err);
        //         res.status(200).json({
        //             data,
        //         });
        //     }
        // );
        // console.log(path.join(__dirname, "../Library", "england.json"));
    }

    async initData(req, res, next) {
        let resp = Object.keys(nations).map(async (item) => {
            return await englandsModel.create({
                tournament: {
                    name: nations[item].params.tournament,
                    slug: nations[item].params.tournament,
                    nation: item,
                    id: nations[item].params.id,
                },
                rows: [],
                topPlayers: {
                    rating: [],
                    goals: [],
                    assists: [],
                    goalsAssistsSum: [],
                    penaltyGoals: [],
                },
                matches: [],
            });
        });

        res.status(200).json({
            message: "done",
            data: resp,
        });
    }
    // async addField(req, res, next){
    //     await englandsModel.updateMany({}, {$set:{"charts": "someValue"}})
    // }
    async addCharts(req, res, next) {
        Object.keys(nations).forEach(async (item) => {
            const info = await checkNation(item, 0);

            let {
                data: { standings },
            } = await axios.get(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/standings/total`
            );
            await englandsModel.updateOne(
                { "tournament.nation": item },
                { $set: { rows: standings[0].rows } }
            );
        });

        res.status(200).json({
            done: "done",
        });
    }
    async addTopPlayers(req, res, next) {
        try {
            Object.keys(nations).forEach(async (item) => {
                if (item !== "vietnam") {
                    const info = await checkNation(item, 0);
                    let {
                        data: { topPlayers },
                    } = await axios.get(
                        `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/top-players/overall`
                    );
                    await englandsModel.updateOne(
                        { "tournament.nation": item },
                        {
                            $set: {
                                topPlayers: {
                                    rating: topPlayers.rating,
                                    goals: topPlayers.goals,
                                    assists: topPlayers.assists,
                                    goalsAssistsSum: topPlayers.goalsAssistsSum,
                                    penaltyGoals: topPlayers.penaltyGoals,
                                },
                            },
                        }
                    );
                }
            });
        } catch (err) {
            console.log(err);
        }
    }
    async addTopPlayers(req, res, next) {
        try {
            Object.keys(nations).forEach(async (item) => {
                if (item !== "vietnam") {
                    const info = await checkNation(item, 0);
                    let {
                        data: { topPlayers },
                    } = await axios.get(
                        `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/top-players/overall`
                    );
                    await englandsModel.updateOne(
                        { "tournament.nation": item },
                        {
                            $set: {
                                topPlayers: {
                                    rating: topPlayers.rating,
                                    goals: topPlayers.goals,
                                    assists: topPlayers.assists,
                                    goalsAssistsSum: topPlayers.goalsAssistsSum,
                                    penaltyGoals: topPlayers.penaltyGoals,
                                },
                            },
                        }
                    );
                }
            });
        } catch (err) {
            console.log(err);
        }
    }
    async addMatch(req, res, next) {
        try {
            // Object.keys(nations).forEach(async (item) => {
            //     if (item !== "england") {
            //         const info = await checkNation(item, 0);

            //         const { rounds } = await getRequest(
            //             `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/rounds`
            //         );

            //         const arrLink = rounds.map((item, index) => {
            //             return () =>
            //                 getRequest(
            //                     `https://api.sofascore.com/api/v1/unique-tournament/${
            //                         info.idNation
            //                     }/season/${info.season.id}/events/round/${
            //                         index + 1
            //                     }`
            //                 );
            //         });

            //         Promise.all(arrLink.map((item) => item()))
            //             .then(async function (result) {
            //                 await englandsModel.updateOne(
            //                     { "tournament.nation": item },
            //                     {
            //                         $set: { matches: result },
            //                     }
            //                 );
            //             })
            //             .catch((err) => {
            //                 console.log(err);
            //             });
            //     }
            // });
            const info = await checkNation("c2", 0);

            const { rounds } = await getRequest(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/rounds`
            );

            const arrLink = rounds
                .filter((item) => !item.name)
                .map((item, index) => {
                    return () =>
                        getRequest(
                            `https://api.sofascore.com/api/v1/unique-tournament/${
                                info.idNation
                            }/season/${info.season.id}/events/round/${
                                index + 1
                            }`
                        );
                });

            Promise.all(arrLink.map((item) => item()))
                .then(async function (result) {
                    await englandsModel.updateOne(
                        { "tournament.nation": "c2" },
                        {
                            $set: { matches: result },
                        }
                    );
                })
                .then(() => {
                    res.status(200).json({
                        message: "done",
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
        } catch (err) {
            console.log(err);
        }
    }
    async addNewField(req, res, next) {
        await englandsModel.updateMany(
            {},
            { teamEvents: {} },
            {
                upsert: false,
            }
        );
    }
    async addTeamEvent(req, res, next) {
        Object.keys(nations).forEach(async (item) => {
            const info = await checkNation(item, 0);
            let {
                data: { tournamentTeamEvents },
            } = await axios.get(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/team-events/total`
            );
            await englandsModel.updateOne(
                { "tournament.nation": item },
                {
                    $set: {
                        teamEvents: Object.values(tournamentTeamEvents)[0],
                    },
                }
            );
        });
    }
}

module.exports = new writeFile();
// const info = await checkNation(item, 0);
// let { data : {topPlayers} } = await axios.get(
//     `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/top-players/overall`
// );
// await englandsModel.updateOne(
//     { "tournament.nation": "england" },
//     { $set: { topPlayers : {
//         rating : [],
//         goals : [],
//         assists : [],
//         goalsAssistsSum : [],
//         penaltyGoals : [] }
//     }}
// );

// await englandsModel.updateMany(
//     {},
//     { $set: { rows: [] } },
//     { returnOriginal: false }
// );

// collection.findOneAndUpdate(
//     { "code": req.body.code },
//     { $set: req.body.updatedFields },
//     { returnOriginal: false },
//     function (err, documents) {
//         res.send({ error: err, affected: documents });
//         db.close();
//     }
// );
