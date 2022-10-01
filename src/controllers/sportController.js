const nations = require("../Library/nation.json");
const { default: axios } = require("axios");
const createError = require("http-errors");
const rp = require("request-promise");
const cheerio = require("cheerio");
const _ = require("lodash");
const englandsModel = require("../models/englandModel");

async function getLastFiveMatch(data) {
    // const { data } = await axios.get(link);
    const tag = Object.keys(data.tournamentTeamEvents); //layas doi truong
    let resp = {};
    const list = data.tournamentTeamEvents;
    tag.forEach((obj) => {
        let state = {};
        let lib = list[obj];

        for (let item in lib) {
            let mc = lib[item];
            let num = item;
            let mct = [];
            // console.log(mc);
            for (let item of mc) {
                let ob = {};
                const winTeam = item.winnerCode;
                if (item.winnerCode === 1) {
                    if (item.homeTeam.id === Number.parseInt(num)) ob.win = 1;
                    else ob.win = -1;
                } else if (item.winnerCode === 2) {
                    if (item.awayTeam.id === Number.parseInt(num)) ob.win = 1;
                    else ob.win = -1;
                } else ob.win = 0;
                ob.match = `${item.homeTeam.shortName} - ${item.awayTeam.shortName}`;
                ob.score = `${item.homeScore.current} - ${item.awayScore.current}`;
                ob.time = new Date(
                    item.startTimestamp * 1000
                ).toLocaleDateString();
                ob.customId = item.customId;
                ob.slug = item.slug;
                // ob.length = item.length;
                mct.push(ob);

                // console.log(typeof item.homeTeam.id + "///" + typeof num);
            }
            state[`${num}`] = mct;
        }
        resp = { ...resp, ...state };
    });

    return resp;
}

const getRequest = async (url) => {
    return await axios.get(url).then((resp) => resp.data);
};

const checkNation = async (nation, s = 0) => {
    // const idNation , idSeason
    const { params, seasons } = nations[nation];
    return {
        idNation: params.id,
        season: { year: seasons[s].year, id: seasons[s].id },
    };
};

class sportController {
    // /charts/:id
    async getCharts(req, res, next) {
        const time = new Date();

        //bang xep hang
        try {
            const { id, nation } = req.params;
            const info = await checkNation(nation, id);

            const resp = await Promise.all([
                getRequest(
                    `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/team-events/total`
                ),
                getRequest(
                    `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/standings/total`
                ),
            ]);
            // const charts = await englandsModel.find(
            //     {
            //         "tournament.nation": nation,
            //     },
            //     { rows: 1 }
            // );

            const data = resp[1].standings.map((item) => item.rows)[0];
            const fiveMatch = await getLastFiveMatch(resp[0]);
            return res.status(200).json({
                mes: "success",
                data,
                fiveMatch,
                season: info.season.year,
                timmer: new Date() - time + "ms",
            });
        } catch (err) {
            console.log(err);
            return next(
                createError("500", "Internal server error at getCharts")
            );
        }
    }
    // /rounds/:id
    async getRounds(req, res, next) {
        const time = new Date();
        const { id, nation } = req.params;
        const info = await checkNation(nation);
        try {
            let data = await getRequest(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/events/round/${id}`
            );
            // data = await reduceMatch(data.events);
            data = await _.chunk(data.events, 2);
            return res.status(200).json({
                mes: "success",
                data,
                timmer: new Date() - time + "ms",
            });
        } catch (err) {
            console.log(err);
            return next(
                createError("500", "Internal server error at get Rounds")
            );
        }
    }
    ///rounds/hightlight

    // /match"
    async getMatch(req, res, next) {
        const time = new Date();
        try {
            const { nation } = req.params;
            const info = await checkNation(nation);
            const rounds = await getRequest(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/rounds`
            );
            const link = (idRound) =>
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/events/round/${idRound}`;
            let resp, bf, cr, af;

            // let rounds = { currentRound: { round: 1 } };
            resp = await Promise.allSettled([
                getRequest(link(rounds.currentRound.round - 1)),
                getRequest(link(rounds.currentRound.round)),
                getRequest(link(rounds.currentRound.round + 1)),
            ]);

            bf =
                resp[0].status === "rejected" || !!resp[0].reason
                    ? null
                    : _.chunk(resp[0].value.events, 2);
            cr = _.chunk(resp[1].value.events, 2);
            af =
                resp[2].status === "rejected" || !!resp[2].reason
                    ? null
                    : _.chunk(resp[2].value.events, 2);

            // console.log(resp);

            return res.status(200).json({
                mes: "success",
                rounds,
                data: [bf, cr, af],
                timmer: new Date() - time + "ms",
            });
        } catch (err) {
            console.log(err);
            return next(
                createError("500", "Internal server error at getMatch")
            );
        }
    }
    // /top-players",
    async getTopPlayers(req, res, next) {
        const { nation } = req.params;
        const info = await checkNation(nation);
        axios
            .get(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/top-players/overall`
            )
            .then((resp) => resp.data)
            .then((data) => {
                return res.status(200).json({
                    mes: "success",
                    data,
                });
            })
            .catch((err) => {
                // console.log(err);
                return next(
                    createError("500", "Internal server error at getTopPlayers")
                );
            });
    }
    async getPlaylistVideo(req, res, next) {
        const time = new Date();
        axios({
            method: "GET",
            url: "https://www.googleapis.com/youtube/v3/playlistItems",
            params: {
                part: "snippet",
                maxResults: "20",
                key: "AIzaSyBle17ccjzisxuWTdnsX0sl0eLBWJMxFxI",
                playlistId: nations[req.params.nation].params.list,
            },
        })
            .then((resp) => {
                // return res.data.items;
                const { items } = resp.data;

                const data = items.map((item) => {
                    const { snippet } = item;
                    const time = snippet.publishedAt
                        .match(/[\d-:]*/gi)
                        .filter((item) => !!item)
                        .join(" ");
                    return {
                        snippet: {
                            publishedAt: time,
                            title: item.snippet.title,
                            videoId: item.snippet.resourceId.videoId,
                            playListId: item.snippet.playListId,
                        },
                    };
                });
                return res.status(200).json({
                    message: "success",
                    data,
                    timmer: new Date() - time + "ms",
                });
            })
            .catch((error) => {
                return next(
                    createError("500", "Internal server error at Playlist")
                );
            });
    }

    async getLiveMatch(req, res, next) {
        const time = new Date();
        try {
            let options = (url) => {
                return {
                    uri: url,
                    transform: function (body) {
                        return cheerio.load(body);
                    },
                };
            };
            const arrLink = await rp(options("https://bit.ly/tiengruoi"))
                .then(async function ($) {
                    const link = $("a.cl_i-content");
                    let arr = await Object.values(link)
                        .map((item) => {
                            if (item.attribs) return item.attribs.href;
                        })
                        .filter((item) => /vebotv/gi.test(item));
                    return arr;
                })
                .catch(function (err) {
                    console.log(err);
                });
            rp(options(arrLink[0]))
                .then(function ($) {
                    let arr = [];
                    let origin = $('link[rel="canonical"]').attr("href");
                    $(".match_list.match_list-grid .item.item-hot").each(
                        (i, el) => {
                            const item = $(el);
                            let homeName = item
                                    .find(".team-home .team-name")
                                    .text(),
                                awayName = item
                                    .find(".team-away .team-name")
                                    .text();
                            arr[i] = {
                                link:
                                    origin.slice(0, origin.lastIndexOf("/")) +
                                    item.find("a").attr("href"),
                                league: {
                                    name: item.find("div.item-league").text(),
                                    img: item
                                        .find(".league-icon img")
                                        .attr("src"),
                                },
                                home: {
                                    name: homeName,
                                    logo: item
                                        .find(".team-home .team-logo img")
                                        .attr("src"),
                                    // score: item
                                    //     .find(".item-info .result .home-score")
                                    //     .text(),
                                },
                                away: {
                                    name: awayName,
                                    logo: item
                                        .find(".team-away .team-logo img")
                                        .attr("src"),
                                    // score: item
                                    //     .find(".item-info .result .away-score")
                                    //     .text(),
                                },
                                commentator: Array.from(
                                    new Set(
                                        item
                                            .find(".commentator")
                                            .text()
                                            .split("\n")
                                    )
                                ).join(""),
                            };
                            let liveStatus = (function () {
                                let day =
                                    item
                                        .find(
                                            ".item-info.block-info-pending .time"
                                        )
                                        .text() || null;
                                let time =
                                    item
                                        .find(
                                            ".item-info.block-info-pending .status"
                                        )
                                        .text() || null;

                                if (day) {
                                    let tar =
                                        day.replace(
                                            /(\d+[/])(\d+[/])/,
                                            "$2$1"
                                        ) +
                                        " " +
                                        time;
                                    return new Date(
                                        tar.replaceAll("\n", "")
                                    ).getTime() > new Date().getTime
                                        ? true
                                        : false;
                                } else return true;
                            })();

                            arr[i].status = {
                                live: liveStatus,
                                homeScore: item
                                    .find(".item-info .result .home-score")
                                    .text(),
                                awayScore: item
                                    .find(".item-info .result .away-score")
                                    .text(),
                                timeLoaded:
                                    item
                                        .find(
                                            ".item-info.block-info-pending .status"
                                        )
                                        .text()
                                        .replaceAll("\n", "") || null,
                                day:
                                    item
                                        .find(
                                            ".item-info.block-info-pending .time"
                                        )
                                        .text()
                                        .replaceAll("\n", "") || null,
                            };
                        }
                    );
                    res.status(200).json({
                        message: "success",
                        live: arr,
                        timmer: new Date() - time,
                    });
                })
                .catch((err) => {
                    next(
                        createError(
                            "500",
                            "Internal server error at getLiveMatch"
                        )
                    );
                });
        } catch (err) {
            next(createError("500", "Internal server error at getLiveMatch"));
        }
    }
    async getLiveSofa(req, res, next) {
        try {
            // const { id, nation } = req.params;
            const nationId = Object.values(nations).map(({ params }) =>
                Number.parseInt(params.id)
            );
            const data = await axios
                .get(
                    `https://api.sofascore.com/api/v1/sport/football/events/live`
                )
                .then((resp) => resp.data);

            let i = 0;
            const resp = data.events
                .map(
                    ({
                        tournament,
                        status,
                        homeTeam,
                        awayTeam,
                        homeScore,
                        awayScore,
                        changes,
                        startTimestamp,
                        slug,
                    }) => {
                        if (tournament.uniqueTournament) {
                            let { id } = tournament.uniqueTournament;
                            if (!nationId.includes(id) && i <= 13) {
                                i++;
                                return {
                                    tournament: {
                                        name: tournament.name,
                                        slug: tournament.slug,
                                        id,
                                    },
                                    status,
                                    homeTeam: {
                                        name: homeTeam.name,
                                        slug: homeTeam.slug,
                                        shortName: homeTeam.shortName,
                                        id: homeTeam.id,
                                        score: homeScore.current,
                                    },
                                    awayTeam: {
                                        name: awayTeam.name,
                                        slug: awayTeam.slug,
                                        shortName: awayTeam.shortName,
                                        id: awayTeam.id,
                                        score: awayScore.current,
                                    },
                                    timeStatus: {
                                        start: startTimestamp,
                                        changes: changes.changeTimestamp,
                                    },
                                    slug,
                                };
                            }
                            if (nationId.includes(id))
                                return {
                                    tournament: {
                                        name: tournament.name,
                                        slug: tournament.slug,
                                        id,
                                    },
                                    status,
                                    homeTeam: {
                                        name: homeTeam.name,
                                        slug: homeTeam.slug,
                                        shortName: homeTeam.shortName,
                                        id: homeTeam.id,
                                        score: homeScore.current,
                                    },
                                    awayTeam: {
                                        name: awayTeam.name,
                                        slug: awayTeam.slug,
                                        shortName: awayTeam.shortName,
                                        id: awayTeam.id,
                                        score: awayScore.current,
                                    },
                                    timeStatus: {
                                        start: startTimestamp,
                                        changes: changes.changeTimestamp,
                                    },
                                    slug,
                                };
                        }
                    }
                )
                .filter((item) => item);
            // console.log(resp);
            return res.status(200).json({
                mes: "success",
                live: resp,
            });
        } catch (err) {
            // console.log(err);
            return next(
                createError("500", "Internal server error at getLiveSofa")
            );
        }
    }
}

module.exports = new sportController();
