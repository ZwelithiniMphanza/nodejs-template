"use strict";


const { v4: uuidv4 } = require('uuid');
const { v5: uuidv5 } = require('uuid');

const mongodbconnect = require("../db/mongo");
const userModel = require("../models/user"); 
const encipher = require("./lib/hashlib");
const bcrypt = require ("bcryptjs");
const jwt = require("jsonwebtoken");
const User = userModel;

mongodbconnect('for UserService.');

class UserService{
    //CREATE: POST METHOD
    static createOne (req, res,next) {

        let response = {};
        const rawBody = req.body;
        const alias = rawBody.name.alias;

        User.findOne({ "name.alias": alias }, async (err, existingUser) => {

            if (existingUser) {

                response.errors = [];
                const error = {
                    id: response.errors.length,
                    status: '400',
                    code: 'error__users__user_name_alias_already_taken',
                    title: 'Error',
                    detail: `User name alias is already taken and must be unique.`,
                    meta: {
                      alias: existingUser.name.alias
                    },
                };

                response.errors.push(error);
                return res.json(response);

            }

            let newUser = new User();

            newUser.id = uuidv5(rawBody.name.alias, uuidv4());
            newUser.name.first = rawBody.name.first;
            newUser.name.last = rawBody.name.last;
            newUser.name.alias = rawBody.name.alias;
            newUser.contact.email = rawBody.contact.email;
            
            const encodeAttempt = await encipher({
                version: process.env.STRATEGY_VERSION,
                key: {
                    password: rawBody.password,
                },
            });

            if (typeof encodeAttempt === 'undefined') {
                
                response.errors = [];
                const error = {
                id: response.errors.length,
                status: '500',
                code: 'error__users__pw_encoding_failed',
                title: 'Error',
                detail: `Encoding password failed. This error handler was probably invoked without awaiting pw.permaEncode() to synchronously return the encoded password.`,
                };
                response.errors.push(error);
                return res.json(response);
            }

            const encodingHasErrors = typeof encodeAttempt.errors !== 'undefined';
            if (encodingHasErrors) {
                console.log('encoding has errors');
                return res.json(encodeAttempt);
            }

            encodeAttempt.data.forEach(datum => {
                console.log('attempt encode');
                if (datum.type === 'password') {
                    newUser.password.hash = datum.attributes.hash;
                    newUser.password.strategy = process.env.STRATEGY_VERSION;       
                }
            });

            newUser.save(err => {

                if (err) {
                    response.errors = [];
                    console.error('Exception caught while saving user...');
                    const error = {
                        id: response.errors.length,
                        status: '500',
                        title: 'Error',
                        code: 'error__users__user_not_saved',
                        detail: 'Failed to save new user',
                        meta: err,
                    };
                    response.errors.push(error);
                    return res.json(response);
                }

                response.data = [];
                const datum = {
                    id: response.data.length,
                    status: '200',
                    code: 'success__users__user_saved',
                    title: 'Success',
                    attributes: {
                    alias: newUser.name.alias,
                    email: newUser.contact.email,
                    },
                };
                response.data.push(datum);
                return res.json(response);

            }); 
        });
    }

    //READ: GET METHOD
    static readMany(req, res,next){

        let response = {};
        User.find(async (err,user) => {
            if (user === null) {
                response.errors = [];
                const error = {
                    id: response.errors.length,
                    status: '404',
                    code: 'error__users__no_such_user',
                    title: 'Error',
                    detail: `Unable to find user with alias: ${req.params.alias}.`,
                    meta: err,
                };

                response.errors.push(error);

                return res.json(response);

            }else{
                
                response.data = [];
                const datum = {
                    id: response.data.length,
                    type: 'User found',
                    attributes: user,
                };

                response.data.push(datum);
                return res.json(response);

            }

        });
        
    }
    static async readOne(req, res,next){

        let response = {};

        if (!req.params) {

            response.errors = [];
            const error = {
                id: response.errors.length,
                status: '400',
                code: 'error__users__missing_params',
                title: 'Error',
                detail: `Missing parameters from request.`,
            };

            response.errors.push(error);
            return res.json(response);

        }

        User.findOne({'name.alias':req.params.alias},async (err, user) => {
            if (user === null) {
                response.errors = [];
                const error = {
                    id: response.errors.length,
                    status: '404',
                    code: 'error__users__no_such_user',
                    title: 'Error',
                    detail: `Unable to find user with alias: ${req.params.alias}.`,
                    meta: err,
                };

                response.errors.push(error);
                return res.json(response);

            }else{

                console.log('user found');
                response.data = [];
                const datum = {
                    id: response.data.length,
                    type: 'User found',
                    attributes: user,
                };

                response.data.push(datum);
                return res.json(response);
            }
        });
    }

    //UPDATE: PUT METHOD
    static updateOne (req, res,next){
        let response = {};
        const rawBody = req.body;
        const alias = rawBody.name.alias;

        User.findOne({ "name.alias": alias }, async (err, existingUser) => {

            if (!existingUser) {

                response.errors = [];
                const error = {
                    id: response.errors.length,
                    status: '400',
                    code: 'error__users__no_such_user',
                    title: 'Error',
                    detail: `Unable to find user with alias: ${alias}.`,
                };

                response.errors.push(error);
                return res.json(response);

            }

            existingUser.name.first = rawBody.name.first;
            existingUser.name.last = rawBody.name.last;
            existingUser.name.alias = rawBody.name.alias;
            existingUser.contact.email = rawBody.contact.email;

            existingUser.save(err => {

                if (err) {
                    response.errors = [];
                    console.error('Exception caught while saving user...');
                    const error = {
                        id: response.errors.length,
                        status: '500',
                        title: 'Error',
                        code: 'error__users__user_not_saved',
                        detail: 'Failed to save new user',
                        meta: err,
                    };
                    response.errors.push(error);
                    return res.json(response);
                }

                response.data = [];
                const datum = {
                    id: response.data.length,
                    status: '200',
                    code: 'success__users__user_saved',
                    title: 'Success',
                    attributes: {
                    alias: existingUser.name.alias,
                    email: existingUser.contact.email,
                    },
                };
                response.data.push(datum);
                return res.json(response);

            }); 
        });
    }

    //DELETE: DELETE METHOD

    static deleteOne(req, res,next){
        //return {"text": "DELETE: it works!"};
        let response = {};

        if (!req.params) {

            response.errors = [];
            const error = {
                id: response.errors.length,
                status: '400',
                code: 'error__users__missing_params',
                title: 'Error',
                detail: `Missing parameters from request.`,
            };

            response.errors.push(error);
            return res.json(response);

        }

        User.deleteOne({'name.alias':req.params.alias}, async (err, user) => {
            if (user === null) {
                response.errors = [];
                const error = {
                    id: response.errors.length,
                    status: '404',
                    code: 'error__users__no_such_user',
                    title: 'Error',
                    detail: `Unable to find user with alias: ${req.params.alias}.`,
                    meta: err,
                };

                response.errors.push(error);
                return res.json(response);

            }else{

                console.log('user found');
                response.data = [];
                const datum = {
                    id: response.data.length,
                    type: 'User found',
                    attributes: user,
                };

                response.data.push(datum);
                return res.json(response);

            };
        });
    }

    static auth(req,res,next){

        
        let response = {};
        if (!req.body) {

            response.errors = [];
            const error = {
                id: response.errors.length,
                status: '400',
                code: 'error__users__missing_params',
                title: 'Error',
                detail: 'Missing parameters from request.',
            };
    
            response.errors.push(error);
            return res.json(response);
    
        }
    
        User.findOne({'name.alias':req.body.alias}, async (err,user) =>{
    
            if (user === null) {
                response.errors = [];
                const error = {
                    id: response.errors.length,
                    status: '404',
                    code: 'error__users__no_such_user',
                    title: 'Error',
                    detail: `Unable to find user with alias: ${req.body.alias}.`,
                    meta: err,
                };
    
                response.errors.push(error);
                return res.json(response);
    
            }
    
            //compare passwords
            bcrypt.compare(req.body.password,user.password.hash,(err,success) => {
               
                if(success){

                    const jwtPayload = {
                        id: user._id,
                        alias: user.name.alias
                    };
                    const jwtData = {
                        expiresIn: '2 hours',
                    };
        
                    const secret = 'secret';
        
                    let token = jwt.sign(jwtPayload, secret, jwtData);
                    console.log(token);
        
                    response.data = [];
                    const datum = {
                        id: response.data.length,
                        status: '200',
                        code: 'success__users__user_authenticated',
                        title: 'Success',
                        token: token,
                    };
                    response.data.push(datum);
                    return res.json(response);

                }

                response.errors = [];
                const error = {
                    id: response.errors.length,
                    status: '404',
                    code: 'error__users__invalid__login',
                    title: 'Error',
                    detail: `Unable to authenticate user`,
                    meta: err,
                };

                response.errors.push(error);
                return res.json(response);
            });
        });
    }
}

module.exports = UserService;