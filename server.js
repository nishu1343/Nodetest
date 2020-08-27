var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");
var HttpClient = require("node-rest-client").Client;
var httpClient = new HttpClient();

var jwt = require("jsonwebtoken");
var config = require("./config");
var UserCoordinate = require("./app/models/user_coordinate");
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8079;
mongoose.connect(config.database);
app.set("superSecret", config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan("dev"));

var io = require("socket.io").listen(app.listen(port));

console.log("API started at http://localhost:" + port);

var apiRoutes = express.Router();

apiRoutes.use(function (req, res, next) {
  var token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  var args = {
    headers: { "Content-Type": "application/json", "x-access-token": token },
  };

  httpClient.get("http://localhost:8078/authapi/userinfo", args, function (
    userInfo,
    response
  ) {
    if (userInfo.success) {
      req.userInfo = userInfo;
      next();
    } else {
      return res.json({
        success: false,
        message: "Failed to authenticate token.",
      });
    }
  });
});

apiRoutes.get("/", function (req, res) {
  res.json({ message: "Welcome" });
});

apiRoutes.post("/saveuserdata", function (req, res) {
  UserCoordinate.findOne({ userName: req.userInfo.userName }, function (
    err,
    userCoordinate
  ) {
    if (err) res.json({ success: false, message: err });

    if (userCoordinate != null) {
      userCoordinate.name = req.body.name;
      userCoordinate.longitude = req.body.longitude;
      userCoordinate.latitude = req.body.latitude;

      userCoordinate.save(function (err) {
        if (err) res.json({ success: false, message: err });

        console.log("User data successfully updated");
        res.json({ success: true });
      });
    } else {
      var newUserCoordinate = new UserCoordinate({
        userName: req.userInfo.userName,
        email: req.userInfo.email,
        name: req.body.name,
        longitude: req.body.longitude,
        latitude: req.body.latitude,
      });

      newUserCoordinate.save(function (err) {
        if (err) res.json({ success: false, message: err });

        console.log("User added successfully");
        res.json({ success: true });
      });
    }
  });
});

apiRoutes.get("/selectedusercoordinate", function (req, res) {
  UserCoordinate.findOne({ userName: req.userInfo.userName }, function (
    err,
    userCoordinate
  ) {
    if (err) res.json({ success: false, message: err });

    if (!userCoordinate) {
      res.json({ success: false, message: "User Not Found" });
    } else {
      userDetail = {};
      userDetail.userName = userCoordinate.userName;
      userDetail.email = userCoordinate.email;
      userDetail.name = userCoordinate.name;
      userDetail.longitude = userCoordinate.longitude;
      userDetail.latitude = userCoordinate.latitude;
      res.json({ userCoordinate: userDetail, success: true });
    }
  });
});

apiRoutes.get("/usercoordinates", function (req, res) {
  UserCoordinate.find({}, function (err, userCoordinates) {
    if (err) res.json({ success: false, message: err });

    var userDetails = new Array();
    userCoordinates.forEach(function (userCoordinate) {
      userDetail = {};
      userDetail.userName = userCoordinate.userName;
      userDetail.email = userCoordinate.email;
      userDetail.name = userCoordinate.name;
      userDetail.longitude = userCoordinate.longitude;
      userDetail.latitude = userCoordinate.latitude;
      userDetails.push(userDetail);
    });

    res.json({ userCoordinates: userDetails, success: true });
  });
});

app.use("/api", apiRoutes);
