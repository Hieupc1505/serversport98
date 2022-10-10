const route = require("express").Router();
const writeFileController = require("../controllers/writeFile");

route.get("/:nation/charts", writeFileController.setCharts);
route.get("/add", writeFileController.addNewField);
route.get("/update", writeFileController.updateHigh);
route.get("/:nation/video", writeFileController.getvideoV2);

module.exports = route;
