const route = require("express").Router();
const imgsCtrl = require("../controllers/imagesController");

route.get("/:title/:id", imgsCtrl.getImage);

module.exports = route;
