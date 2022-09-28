require("dotenv").config();

const express = require("express");
const routerCustom = require("./src/routers/index");
const cors = require("cors");
const bodyParser = require("body-parser");
const createError = require("http-errors");

const app = express();

app.use(cors());
// app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routerCustom(app);

// if (process.env.NODE_ENV === "production") {
//     app.get("*", (req, res) => {
//         res.status(500).json({
//             message: "get fail oki",
//         });
//     });
// }

app.use((req, res, next) => {
    next(createError.NotFound("Page is not found"));
});

app.use((err, req, res, next) => {
    res.status(err.status || 500)
        .json({
            sucess: false,
            err: err.message || "Internal Server errorrs",
        })
        .end();
});

const port = process.env.PORT || 7500;
app.listen(port, () => {
    console.log("App is running at : ", port);
});
