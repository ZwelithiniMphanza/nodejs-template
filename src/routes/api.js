"use strict";

const Router = require("express").Router;
const jwt = require("../config/jwt");
const UserService = require("../services/user.js");

module.exports = () => {

    const api = new Router();

    //get by param
    api.get("/get-one/:alias",jwt, async (req, res,next) => {
        await UserService.readOne(req, res,next);
    });

    api.get("/", async (req, res,next) => {
        await UserService.readMany(req, res,next)
    });
    
    api.post("/", async (req, res,next) => {
        await UserService.createOne (req, res,next);
    });
    
    api.put("/update-one", async (req, res,next) => {
        await UserService.updateOne(req, res,next);
	});

	api.delete("/delete-one/:alias", async (req, res,next) => {
        await UserService.deleteOne(req, res,next);
    });

    api.post("/auth", async (req, res,next) => {
        await UserService.auth(req, res,next);
    });

    return api;

};
