require("dotenv").config();
// const request = require("request-promise");
// const axios = require("axios");
// const cheerio = require("cheerio");
const express = require("express");
const routerCustom = require("./src/routers/index");
const cors = require("cors");
const path = require("path");

const app = express();
//hake
app.use(
    cors({
        credentials: true,
        origin: ["http://localhost:3000", "https://league88.netlify.app"],
        exposedHeaders: ["set-cookie"],
    })
);

routerCustom(app);

if (process.env.NODE_ENV === "production") {
    // app.use(express.static("client/build"));
    app.get("*", (req, res) => {
        res.status(500).json({
            message: "get fail",
        });
    });
}

const port = process.env.PORT || 7500;
app.listen(port, () => {
    console.log("App is running at : ", port);
});
