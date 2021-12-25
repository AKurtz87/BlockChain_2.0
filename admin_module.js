const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const key = ec.genKeyPair();

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";

const addUser = function (username, password, balance = 0) {
  let hash = crypto.createHash("sha256").update(password).digest("hex");
  let myWalletAddress = key.getPublic("hex");
  let myKey = key.getPrivate("hex");

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("users");
    let myobj = {
      user: username,
      hash: hash,
      myKey: myKey,
      myWalletAddress: myWalletAddress,
      balance: balance,
    };
    dbo.collection("users").insertOne(myobj, function (err, res) {
      if (err) throw err;
      console.log("User Inserted");
      db.close();
    });
  });
};

addUser("alessio", "password");

const delete_user = function (username) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("users");
    let myquery = { user: username };
    dbo.collection("users").deleteOne(myquery, function (err, obj) {
      if (err) throw err;
      console.log("User Deleted");
      db.close();
    });
  });
};

const update_psw = function (username, password) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("users");
    let myquery = { user: username };
    let hash = crypto.createHash("sha256").update(password).digest("hex");
    let newvalues = { $set: { password: hash } };
    dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
      if (err) throw err;
      console.log("UserPassword Updated");
      db.close();
    });
  });
};
