
"use strict";

const {Schema, model} = require("mongoose");

const UserSchema = new Schema(
    {
      id: { type: String, unique: true },
      name: {
        first: { type: String },
        last: { type: String },
        alias: { type: String, unique: true },
      },
      contact: {
        email: { type: String },
      },
      password: {
        hash: { type: String },
        strategy: { type: String },
      },
    },
    { timestamps: true }
);

const User = model('User', UserSchema);

module.exports = User;