const sportRouter = require("./sportRouter");
const imagesRouter = require("./imageRouter");
const routerCustom = (app) => {
    app.use("/api/", sportRouter);
    app.use("/images", imagesRouter);
};

module.exports = routerCustom;
