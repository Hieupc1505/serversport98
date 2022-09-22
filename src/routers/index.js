const sportRouter = require("./sportRouter");
// const shopRouter = require("./shopRouter");

const routerCustom = (app) => {
    app.use("/api/", sportRouter);
    // app.use("/api/shop", shopRouter);
};

module.exports = routerCustom;
