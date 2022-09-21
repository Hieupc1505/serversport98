const nations = require("../Library/nation.json");
const { default: axios } = require("axios");

async function getLastFiveMatch(link) {
    const { data } = await axios.get(link);
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
    return axios.get(url).then((resp) => resp.data);
};
const reduceMatch = async (arr) => {
    return arr.reduce((pre, curr) => {
        let l = pre.length;
        if (l == 0 || pre[l - 1].length == 2) {
            return [...pre, [curr]];
        } else {
            let tc = pre.pop();

            return [...pre, [...tc, curr]];
        }
    }, []);
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
    async getCharts(req, res) {
        //bang xep hang
        try {
            const { id, nation } = req.params;

            const info = await checkNation(nation, id);

            const fiveMatch = await getLastFiveMatch(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/team-events/total`
            );

            const resp = await axios
                .get(
                    `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/standings/total`
                )

                .then((resp) => resp.data);

            const data = resp.standings.map((item) => item.rows);
            // let fiveM = fiveMatch.reduce((old, val) => {
            //     return { ...old, ...val };
            // }, {});
            // .then((data) => {
            //     res.status(200).json({
            //         mes: "success",
            //         data: data.standings[0].rows,
            //         fiveMatch,
            //         season: info.season.year,
            //     });
            // });
            // res.json({ fiveMatch });
            res.status(200).json({
                mes: "success",
                data,
                fiveMatch,
                season: info.season.year,
            });
        } catch (err) {
            console.log(err);
        }
    }
    // /rounds/:id
    async getRounds(req, res) {
        const { id, nation } = req.params;
        const info = await checkNation(nation);
        try {
            let data = await getRequest(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/events/round/${id}`
            );
            data = await reduceMatch(data.events);
            res.status(200).json({
                mes: "success",
                data,
            });
        } catch (err) {
            res.status(500).json({
                mes: err.message,
            });
        }
    }
    ///rounds/hightlight

    // /match"
    async getMatch(req, res) {
        const { nation } = req.params;
        const info = await checkNation(nation);
        const rounds = await getRequest(
            `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/rounds`
        );
        const link = (idRound) =>
            `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/events/round/${idRound}`;
        let resp, bf, cr, af;
        if (
            rounds.currentRound.round >= 2 &&
            rounds.currentRound.round <= rounds.rounds.length - 1
        ) {
            resp = await Promise.all([
                getRequest(link(rounds.currentRound.round - 1)),
                getRequest(link(rounds.currentRound.round)),
                getRequest(link(rounds.currentRound.round + 1)),
            ]);
            bf = await reduceMatch(resp[0].events);
            cr = await reduceMatch(resp[1].events);
            af = await reduceMatch(resp[2].events);
        } else if (rounds.currentRound.round < 2) {
            resp = await Promise.all([
                getRequest(link(rounds.currentRound.round)),
                getRequest(link(rounds.currentRound.round + 1)),
            ]);
            bf = null;
            cr = await reduceMatch(resp[1].events);
            af = await reduceMatch(resp[2].events);
        } else if (rounds.currentRound.round > rounds.rounds.length - 1) {
            resp = await Promise.all([
                getRequest(link(rounds.currentRound.round - 1)),
                getRequest(link(rounds.currentRound.round)),
            ]);
            bf = await reduceMatch(resp[0].events);
            cr = await reduceMatch(resp[1].events);
            af = null;
        }

        // let data =
        //     rounds.currentRound.round &&
        //     (await getRequest(
        //         `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/events/round/${rounds.currentRound.round}`
        //     ));

        // data = await reduceMatch(data.events);
        res.status(200).json({
            mes: "success",
            rounds,
            data: [bf, cr, af],
        });
    }
    // /top-players",
    async getTopPlayers(req, res) {
        const { nation } = req.params;
        const info = await checkNation(nation);
        axios
            .get(
                `https://api.sofascore.com/api/v1/unique-tournament/${info.idNation}/season/${info.season.id}/top-players/overall`
            )
            .then((resp) => resp.data)
            .then((data) => {
                res.status(200).json({
                    mes: "success",
                    data,
                });
            })
            .catch((err) => console.log);
    }
    async getPlaylistVideo(req, res) {
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
                    // console.log(time);
                    return {
                        snippet: {
                            publishedAt: time,
                            title: item.snippet.title,
                            videoId: item.snippet.resourceId.videoId,
                            playListId: item.snippet.playListId,
                        },
                    };
                });
                // console.log(data);
                return res.status(200).json({
                    message: "success",
                    data,
                });
            })
            .catch((error) => {
                console.log(error);
            });
    }
}

module.exports = new sportController();
