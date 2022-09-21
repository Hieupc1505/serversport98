const sportRouter = require("./sportRouter");
// const shopRouter = require("./shopRouter");

const routerCustom = (app) => {
    app.use("/api/sports/", sportRouter);
    // app.use("/api/shop", shopRouter);
};

module.exports = routerCustom;
