const route = require("express").Router();
const sportController = require("../controllers/sportController");
const {
    udCharts,
    udMatch,
    udTopPlayers,
    udList,
} = require("../middleware/updateSports");

//api/sports
route.get("/live-match", sportController.getLiveSofa);
route.get("/vebo", sportController.getLiveMatch);
route.get("/test", sportController.getTest);

route.get("/:nation/charts/:id", udCharts, sportController.getCharts);
route.get("/:nation/match", udMatch, sportController.getMatch);
route.get("/:nation/rounds/:id", sportController.getRounds);
route.get("/:nation/top-players", udTopPlayers, sportController.getTopPlayers);
route.get("/:nation/playlist", udList, sportController.getPlaylistVideo);
route.get("/:nation/video", sportController.getVideo);

module.exports = route;
