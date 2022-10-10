const route = require("express").Router();
const testDb = require("../controllers/testDb");

route.get("/init", testDb.init);

module.exports = route;
