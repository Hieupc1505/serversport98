const nations = require("../Library/nation.json");
const { default: axios } = require("axios");
const createError = require("http-errors");
const rp = require("request-promise");
const cheerio = require("cheerio");
const _ = require("lodash");
const leaguesModel = require("../models/leaguesModel");
const hightLight = require("../models/hightLight");

async function getLastFiveMatch(data) {
    // const { data } = await axios.get(link);
    if (data) {
        const tag = Object.keys(data); //layas id giai doi truong
        // const list = data; //lay id cua doi
        let resp = {};

        tag.forEach((obj) => {
            //lap tung keys teamEvents
            let state = {};

            let lib = data[obj]; // value cuar 1462

            for (let item in lib) {
                //tung key of object trong 1462
                let mc = lib[item];
                let num = item;
                let mct = [];
                // console.log(mc);
                for (let team of mc) {
                    let ob = {};
                    const winTeam = team.winnerCode;
                    if (team.winnerCode === 1) {
                        if (team.homeTeam.id === Number.parseInt(num))
                            ob.win = 1;
                        else ob.win = -1;
                    } else if (team.winnerCode === 2) {
                        if (team.awayTeam.id === Number.parseInt(num))
                            ob.win = 1;
                        else ob.win = -1;
                    } else ob.win = 0;
                    ob.match = `${team.homeTeam.shortName} - ${team.awayTeam.shortName}`;
                    ob.score = `${team.homeScore.current} - ${team.awayScore.current}`;
                    ob.time = new Date(
                        team.startTimestamp * 1000
                    ).toLocaleDateString();
                    ob.customId = team.customId;
                    ob.slug = team.slug;
                    mct.push(ob);
                }
                state[`${num}`] = mct;
            }
            resp = { ...resp, ...state };
        });

        return resp;
    }
}
const getString = (tt) => {
    let tar = tt.split(" - ");

    return `\"${tar[0]}\" ${tar[1]}\"`;
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

        try {
            const { charts, teamEvents } = req;
            const { id, nation } = req.params;

            const info = await checkNation(nation, id);
            const fiveMatch = await getLastFiveMatch(teamEvents);

            return res.status(200).json({
                mes: "success",
                data: charts,
                fiveMatch,
                season: info.season.year,
                timmer: new Date() - time + "ms",
            });
        } catch (err) {
            // console.log(err);
            return next(
                createError("500", "Internal server error at getCharts")
            );
        }
    }
    // /rounds/:id
    async getRounds(req, res, next) {
        const time = new Date();
        const { id, nation } = req.params;
        try {
            const [query] = await leaguesModel.aggregate([
                { $match: { "tournament.nation": nation } },
                {
                    $project: {
                        match: {
                            $arrayElemAt: ["$matches", Number.parseInt(id) - 1],
                        },
                    },
                },
            ]);
            let data = await _.chunk(query.match.events, 2);
            return res.status(200).json({
                mes: "success",
                data,
                timmer: new Date() - time + "ms",
            });
        } catch (err) {
            // console.log(err);
            return next(
                createError("500", "Internal server error at get Rounds")
            );
        }
    }

    async getMatch(req, res, next) {
        const time = new Date();
        try {
            const { currentRound, rounds } = req.rounds;
            const { nation } = req.params;

            const [query] = await leaguesModel.aggregate([
                { $match: { "tournament.nation": nation } },
                {
                    $project: {
                        before: {
                            $cond: {
                                if: {
                                    $eq: [currentRound.round - 2, -1],
                                },
                                then: null,
                                else: {
                                    $arrayElemAt: [
                                        "$matches",
                                        currentRound.round - 2,
                                    ],
                                },
                            },
                        },
                        current: {
                            $arrayElemAt: ["$matches", currentRound.round - 1],
                        },
                        after: {
                            $cond: {
                                if: {
                                    $eq: [currentRound.round, rounds.length],
                                },
                                then: null,
                                else: {
                                    $arrayElemAt: [
                                        "$matches",
                                        currentRound.round,
                                    ],
                                },
                            },
                        },
                    },
                },
            ]);
            let bf =
                query.before === null ? null : _.chunk(query.before.events, 2);

            let cr = _.chunk(query.current.events, 2);
            let af =
                query.after === null ? null : _.chunk(query.after.events, 2);

            return res.status(200).json({
                mes: "success",
                rounds: { currentRound, rounds },
                data: [bf, cr, af],
                timmer: new Date() - time + "ms",
            });
        } catch (err) {
            // console.log(err);
            return next(
                createError("500", "Internal server error at getMatch")
            );
        }
    }
    // /top-players",
    async getTopPlayers(req, res, next) {
        const { nation } = req.params;

        try {
            res.status(200).json({
                data: req.topPlayers,
            });
        } catch (err) {
            return next(
                createError("500", "Internal server error at getMatch")
            );
        }
    }
    async getPlaylistVideo(req, res, next) {
        try {
            const { nation } = req.params;
            const data = await hightLight
                .find({
                    nation: nation,
                })
                .sort({ createdAt: -1 })
                .limit(30)
                .select("-_id");
            res.status(200).json({
                message: "err",
                data,
            });
        } catch (err) {
            // console.log(err);
            res.status(200).json({
                message: "err",
                data: [],
            });
        }
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
                    if (origin)
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
                                        origin.slice(
                                            0,
                                            origin.lastIndexOf("/")
                                        ) + item.find("a").attr("href"),
                                    league: {
                                        name: item
                                            .find("div.item-league")
                                            .text(),
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
                    console.log(err);
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
            res.json({
                mes: "fail",
                live: [],
            });
        }
    }
    async getVideo(req, res, next) {
        const { q, c, pub } = req.query;
        const { nation } = req.params;
        let time = new Date(new Date(pub) - 24 * 60 * 60 * 1000);

        const str = getString(q);

        const result = await hightLight.find({
            nation: nation,
            createdAt: { $gt: new Date(time) },
            $text: { $search: str },
        });
        if (!!result.length) {
            return res.status(200).json({
                id: result[0].videoId,
            });
        } else {
            const { data } = await axios({
                method: "GET",
                url: "https://www.googleapis.com/youtube/v3/search",
                params: {
                    part: "snippet",
                    maxResults: "4",
                    key: "AIzaSyBle17ccjzisxuWTdnsX0sl0eLBWJMxFxI",
                    q,
                    publishedAfter: time,
                    regionCode: "VN",
                },
            });
            console.log(data);
            const result = data.items.filter(
                (item) => item.snippet.channelId === c
            );
            if (result[0]) res.status(200).json({ id: result[0].id.videoId });
            else {
                if (data.items[0])
                    res.status(200).json({
                        id: data.items[0].id.videoId,
                    });
                else res.status(200).json({ id: null });
            }
        }
    }
    async getTest(req, res, next) {
        const data = await leaguesModel.find({
            "tournament.nation": "england",
        });
        res.status(200).json({
            data,
        });
    }
}

module.exports = new sportController();
