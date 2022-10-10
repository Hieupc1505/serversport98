const sportRouter = require("./sportRouter");
const initDB = require("./initDB");

const routerCustom = (app) => {
    app.use("/api/", sportRouter);
    app.use("/test/", initDB);
};

module.exports = routerCustom;
