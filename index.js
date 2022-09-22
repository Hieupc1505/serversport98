require("dotenv").config();

const express = require("express");
const routerCustom = require("./src/routers/index");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routerCustom(app);

if (process.env.NODE_ENV === "production") {
    app.get("*", (req, res) => {
        res.status(500).json({
            message: "get fail oki",
        });
    });
}

const port = process.env.PORT || 7500;
app.listen(port, () => {
    console.log("App is running at : ", port);
});
