"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;
module.exports = mongoose.model("UserCoordinate", new Schema({
  name: String,
  email: String,
  userName: String,
  longitude: String,
  latitude: String
}));