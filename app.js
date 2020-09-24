"use strict";

const express = require("express"); //
const cluster = require("cluster");
const bodyParser = require("body-parser"); //
const logger = require("morgan"); //
const cors = require("cors"); //
const helmet = require("helmet"); //
const os = require("os");
const apiRoutes = require("./src/routes/api");


require("dotenv").config();

const numCPUs = os.cpus().length;
var app;

if (cluster.isMaster) {

	for (let i = 0; i < numCPUs; i++) {

		cluster.fork();

	}

	cluster.on("exit", (worker) => {

		console.log(`worker ${worker.process.pid} died`);

	});
	cluster.on("death", (worker) => {

		console.log(`Worker ${worker.pid} died.`);

	});

}else{

    const app = express();

    app.set("port", process.env.SERVER__APP__PORT || 3000);
	app.use(express.static("static"));
    app.use(logger("dev"));
	app.use(bodyParser.json({limit: "50mb"}));
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.raw());
	app.use(cors());
    app.use(helmet());

    process.on("unhandledRejection", (reason, p) => {

		console.log("Unhandled Rejection at: Promise", p, "reason:", reason);

    });
    
    app.use("/api/", apiRoutes());

    app.use((err, req, res, next) => {
        res.status(err.status)
          .json({
            status: err.status,
            message: err.message
        });
    });

    /*
    app.use((req, res) => {

		res.status(401).send("Sorry not found! 404!");

    });*/

    app.use((req, res) => {

		res.status(404).send("Sorry not found! 404!");

    });
    
    app.use((req, res) => {

		res.status(500).send("Sorry! Something broke!");

    });
    
    app.listen(app.get("port"));
    console.log(`App listening on ${app.get("port")}`);

}


