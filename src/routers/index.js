const sportRouter = require("./sportRouter");

const routerCustom = (app) => {
    app.use("/api/", sportRouter);
};

module.exports = routerCustom;
