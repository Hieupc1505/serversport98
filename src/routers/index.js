const sportRouter = require("./sportRouter");
const initDb = require("./initDB");
// const shopRouter = require("./shopRouter");

const routerCustom = (app) => {
    app.use("/api/", sportRouter);
    app.use("/test/", initDb);
    // app.use("/api/shop", shopRouter);
};

module.exports = routerCustom;
