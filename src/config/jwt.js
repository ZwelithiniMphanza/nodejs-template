const jwt = require("express-jwt");

module.exports = jwt({
    secret: 'secret'
});