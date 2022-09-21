const route = require("express").Router();
const sportController = require("../controllers/sportController");
//api/sports
route.get("/:nation/charts/:id", sportController.getCharts);
route.get("/:nation/match", sportController.getMatch);
route.get("/:nation/rounds/:id", sportController.getRounds);
route.get("/:nation/top-players", sportController.getTopPlayers);
route.get("/:nation/playlist", sportController.getPlaylistVideo);

module.exports = route;
