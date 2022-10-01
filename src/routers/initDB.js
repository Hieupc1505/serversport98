const route = require("express").Router();
const writeFileController = require("../controllers/writeFile");

route.get("/write", writeFileController.getMatch);
route.get("/init", writeFileController.initData);
route.get("/add", writeFileController.addCharts);
route.get("/top", writeFileController.addTopPlayers);
route.get("/match", writeFileController.addMatch);
route.get("/new", writeFileController.addNewField);
route.get("/event", writeFileController.addTeamEvent);

module.exports = route;
