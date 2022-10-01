const route = require("express").Router();
const sportController = require("../controllers/sportController");
const writeFileController = require("../controllers/writeFile");

//api/sports
route.get("/live-match", sportController.getLiveSofa);
route.get("/vebo", sportController.getLiveMatch);

route.get("/:nation/charts/:id", sportController.getCharts);
route.get("/:nation/match", sportController.getMatch);
route.get("/:nation/rounds/:id", sportController.getRounds);
route.get("/:nation/top-players", sportController.getTopPlayers);
route.get("/:nation/playlist", sportController.getPlaylistVideo);

module.exports = route;
