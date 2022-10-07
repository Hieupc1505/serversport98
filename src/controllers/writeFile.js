const axios = require("axios");
const fs = require("fs");
const path = require("path");
const englandsModel = require("../models/englandModel");
const hightLight = require("../models/hightLight");
const nations = require("../Library/nation.json");
const _ = require("lodash");

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

const checkUpdate = async (nation) => {
    const timeNow = new Date();
    const [query] = await englandsModel.find(
        {
            "tournament.nation": nation,
        },
        "updatedAt -_id"
    );

    const pass = (timeNow - query.updatedAt) / (1000 * 60 * 60);
    return pass > 7 ? true : false;
};
const getField = async (field, nation) => {
    const [query] = await englandsModel.find(
        {
            "tournament.nation": nation,
        },
        { [field]: 1, _id: 0 }
    );
    return query[field];
};
const comparseMatch = async (data, field, round, nation) => {
    const [query] = await englandsModel.aggregate([
        { $match: { "tournament.nation": nation } },
        {
            $project: {
                data: {
                    $arrayElemAt: [`$${field}`, round - 1],
                },
            },
        },
    ]);

    return _.isEqual(data, query.data);
};
class writeFile {
    async addCharts(nation, req) {
        let result;
        try {
            const info = await checkNation(nation, 0);
            const charts = await getField("rows", nation);

            result = charts;
            let {
                data: { standings },
            } = await axios.get(
                `thttps://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/standings/total`
            );

            if (
                (await checkUpdate(nation)) ||
                !_.isEqual(standings[0].rows, charts)
            ) {
                console.log("update charts");
                const resp = await englandsModel
                    .findOneAndUpdate(
                        { "tournament.nation": nation },
                        { $set: { rows: standings[0].rows } },
                        { new: true }
                    )
                    .select("rows -_id");
                req.charts = resp.rows;
                return;
            }
            req.charts = charts;
            return;
        } catch (err) {
            req.charts = result;

            throw new Error("handle update charts error");
        }
    }
    async addRounds(nation, req) {
        let result;
        try {
            const info = await checkNation(nation, 0);
            const rounds = await getField("rounds", nation);
            result = rounds;
            let { data } = await axios.get(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/rounds`
            );
            if ((await checkUpdate(nation)) || !_.isEqual(data, rounds)) {
                console.log("update rounds");
                const resp = await englandsModel
                    .findOneAndUpdate(
                        { "tournament.nation": nation },
                        { $set: { rounds: data } },
                        { new: true }
                    )
                    .select("rounds -_id");
                req.rounds = resp.rounds;
                return;
            }
            req.rounds = data;
            return;
        } catch (err) {
            req.rounds = result;
            throw new Error("have error at addRoudns");
        }

        // res.status(200).json({
        //     done: "done",
        // });
    }

    async addTopPlayers(req, nation) {
        let result;
        try {
            if (nation !== "vietnam") {
                const info = await checkNation(nation, 0);
                const {
                    rating,
                    goals,
                    assists,
                    goalsAssistsSum,
                    penaltyGoals,
                } = await getField("topPlayers", nation);

                result = {
                    rating: rating,
                    goals: goals,
                    assists: assists,
                    goalsAssistsSum: goalsAssistsSum,
                    penaltyGoals: penaltyGoals,
                };
                let {
                    data: { topPlayers },
                } = await axios.get(
                    `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/top-players/overall`
                );
                const result2 = {
                    rating: topPlayers.rating,
                    goals: topPlayers.goals,
                    assists: topPlayers.assists,
                    goalsAssistsSum: topPlayers.goalsAssistsSum,
                    penaltyGoals: topPlayers.penaltyGoals,
                };
                if (
                    (await checkUpdate(nation)) ||
                    !_.isEqual(result, result2)
                ) {
                    console.log("update topplayers");
                    const resp = await englandsModel
                        .findOneAndUpdate(
                            { "tournament.nation": nation },
                            {
                                $set: {
                                    topPlayers: result2,
                                },
                            },
                            { new: true }
                        )
                        .select("topPlayers -_id");
                    req.topPlayers = resp.topPlayers;
                    return;
                }
                req.topPlayers = result;
                return;
            }
        } catch (err) {
            req.topPlayers = result;
            throw new Error("have an error from addTopPlayers");
        }
    }
    async addMatch(nation, roundsInfo) {
        let result;
        try {
            const info = await checkNation(nation, 0);

            // const [roundsInfo] = await englandsModel.find(
            //     {
            //         "tournament.nation": nation,
            //     },
            //     { rounds: 1, _id: 0 }
            // );
            const { currentRound, rounds } = roundsInfo;

            const data = await getRequest(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/events/round/${currentRound.round}`
            );

            const index = currentRound.round - 1;
            if (
                (await checkUpdate(nation)) ||
                !(await comparseMatch(
                    data,
                    "matches",
                    currentRound.round,
                    nation
                ))
            ) {
                console.log("update match");
                await englandsModel.updateOne(
                    { "tournament.nation": nation },
                    { $set: { [`matches.${index}.events`]: data.events } }
                );
            }
        } catch (err) {
            throw new Error("have an error with axios add match");
        }
    }
    async addNewField() {
        Object.keys(nations).map(async (item) => {
            await hightLight.updateOne(
                {
                    nation: item,
                },
                {
                    $set: { hightLights: [] },
                }
            );
        });
    }
    async addTeamEvent(nation, req) {
        let result;
        try {
            const info = await checkNation(nation, 0);
            const teamEvents = await getField("teamEvents", nation);
            result = teamEvents;
            let {
                data: { tournamentTeamEvents },
            } = await axios.get(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/team-events/total`
            );
            if (
                (await checkUpdate(nation)) ||
                !_.isEqual(tournamentTeamEvents, teamEvents)
            ) {
                console.log("update teamevents");
                const resp = await englandsModel
                    .updateOne(
                        { "tournament.nation": nation },
                        {
                            $set: {
                                teamEvents: tournamentTeamEvents,
                            },
                        },
                        { new: true }
                    )
                    .select("teamEvents -_id");
                req.teamEvents = resp.teamEvents;
                return;
            }
            req.teamEvents = teamEvents;
            return;
        } catch (err) {
            req.teamEvents = result;
            throw new Error("axios request error");
        }
    }
    async setCharts(req, res, next) {
        Object.keys(nations).forEach(async (item) => {
            const info = await checkNation(item, 0);
            let {
                data: { standings },
            } = await axios.get(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/standings/total`
            );
            const result = standings.map((item) => item.rows);
            await englandsModel.updateOne(
                { "tournament.nation": item },
                {
                    $set: {
                        rows: result,
                    },
                }
            );
        });
        // const info = await checkNation("c1", 0);
        // let {
        //     data: { standings },
        // } = await axios.get(
        //     `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/standings/total`
        // );
        // const result = standings.map((item) => item.rows);
        // res.status(200).json({
        //     data: result,
        // });
        // console.log(result);
    }
    async getPlaylistVideo(req, res, next) {
        // const time = new Date();
        Object.keys(nations).map((nation) => {
            axios({
                method: "GET",
                url: "https://www.googleapis.com/youtube/v3/playlistItems",
                params: {
                    part: "snippet",
                    maxResults: "50",
                    key: "AIzaSyBle17ccjzisxuWTdnsX0sl0eLBWJMxFxI",
                    playlistId: nations[nation].params.list,
                },
            })
                .then(async (resp) => {
                    // return res.data.items;
                    const { items } = resp.data;

                    const data = items.map((item) => {
                        const { snippet } = item;
                        const time = snippet.publishedAt
                            .match(/[\d-:]*/gi)
                            .filter((item) => !!item)
                            .join(" ");
                        return {
                            publishedAt: time,
                            title: item.snippet.title,
                            videoId: item.snippet.resourceId.videoId,
                        };
                    });

                    await hightLight.updateOne(
                        { nation: nation },
                        {
                            $set: {
                                hightLights: data,
                            },
                        }
                    );
                })
                .catch((err) => {
                    console.log(err);
                    // return next(
                    //     createError("500", "Internal server error at Playlist")
                    // );
                });
        });
    }
    async getvideoV2(nation) {
        let result = [];

        function getUrl(nation, pagetoken) {
            var pt =
                    typeof pagetoken === "undefined"
                        ? ""
                        : `&pageToken=${pagetoken}`,
                mykey = "AIzaSyBle17ccjzisxuWTdnsX0sl0eLBWJMxFxI",
                playListID = nations[nation].params.list,
                URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playListID}&key=${mykey}${pt}`;
            return URL;
        }

        async function apiCall(nation, npt) {
            axios
                .get(getUrl(nation, npt))
                .then((response) => {
                    return response.data;
                })
                .then(async function (response) {
                    if (response.error) {
                        console.log(response.error);
                    } else {
                        responseHandler(nation, response);
                    }
                });
        }
        async function updateDate(nation, result) {
            result.forEach(async (item, index) => {
                const data = await hightLight.find({
                    nation: nation,
                    videoId: item.videoId,
                });

                if (!data.length) {
                    await hightLight.create({
                        nation: nation,
                        ...item,
                    });
                }
            });
        }
        async function responseHandler(nation, resp) {
            if (resp.nextPageToken) apiCall(nation, resp.nextPageToken);

            const { items } = resp;

            const data = items.map((item) => {
                const { snippet } = item;
                const time = snippet.publishedAt
                    .match(/[\d-:]*/gi)
                    .filter((item) => !!item)
                    .join(" ");
                return {
                    publishedAt: time,
                    title: item.snippet.title,
                    videoId: item.snippet.resourceId.videoId,
                    createdAt: new Date(time).toISOString(),
                };
            });
            result = [...result, ...data];
            if (!resp.nextPageToken) {
                updateDate(nation, result);
            }
        }

        // Object.keys(nations).forEach(async (nation, index) => {
        //     // let list = [];
        //     result = [];
        //     setTimeout(() => {
        //         apiCall(nation);
        //     }, index * 1000);
        // });
        apiCall(nation);
    }
    async updateHigh(req, res, next) {
        await hightLight.updateMany({}, [
            { $set: { createdAt: { $toDate: "$publishedAt" } } },
        ]);
    }
}

module.exports = new writeFile();
