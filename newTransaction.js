const Blockchain = require("./newMining_module");

const crypto = require("crypto");

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";

const colors = require("colors");
colors.setTheme({
  bgGreen: "bgGreen",
  bgCyan: "bgCyan",
  yellow: "yellow",
  bgBlue: "bgBlue",
  blue: "blue",
  bold: "bold",
});

//------------------------------------------------------------------------------------------------------------//

class Transaction {
  constructor(user, password, amount, addressTo) {
    this.transaction = this.generateTransaction(
      user,
      password,
      amount,
      addressTo
    );
  }

  generateTransaction(username, password, amount, addressTo) {
    let loginHash = crypto.createHash("sha256").update(password).digest("hex");
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      const dbo = db.db("blockchain");

      dbo
        .collection("user")
        .find({ user: username })
        .toArray(function (err, result) {
          if (err) throw err;
          //console.log(result[0]);

          let userName = result[0].user;
          let userHash = result[0].hash;
          let addressFrom = result[0].myWalletAddress;
          let userPrivateKey = result[0].myKey;
          let balance = result[0].balance;

          if (userName === username && userHash === loginHash) {
            console.log("\nLogin correct!".green.bold);
          } else {
            return console.log("\nLogin wrong!".red.bold);
          }

          if (userName.length === 0) {
            console.log("\nUsername not found!\n".red.bold);
            return console.log("error");
          }

          if (amount <= 0) {
            console.log(
              "\nError in amount, no 0 or negative amount allowed!\n".red.bold
            );
            return console.log("error");
          }

          if (amount > balance) {
            console.log("\nBalance insufficient!\n".red.bold);
            return console.log("error");
          }

          // 01 TRANSACTION HASH
          const calculateTransactionHash = function (
            addressFrom,
            addressTo,
            amount
          ) {
            let time = new Date();
            let txHash = crypto
              .createHash("sha256")
              .update(time + addressFrom + addressTo + amount)
              .digest("hex");
            return txHash;
          };

          // 02 SIGN TRANSACTION
          const signTransaction = function (
            userPrivateKey,
            userWalletAddress,
            txHash
          ) {
            let signKey = ec.keyFromPrivate(userPrivateKey);

            if (signKey.getPublic("hex") !== userWalletAddress) {
              throw new Error(
                "You cannot sign transactions for other wallets!"
              );
            }

            let sig = signKey.sign(txHash, "base64");

            let signature = sig.toDER("hex");

            //console.log(signature);

            return signature;
          };

          let hash = calculateTransactionHash(addressFrom, addressTo, amount);

          let transaction = {
            addressFrom: addressFrom,
            addressTo: addressTo,
            amount: amount,
            txHash: hash,
            sign: signTransaction(userPrivateKey, addressFrom, hash),
          };

          let transactionJSON = JSON.stringify(transaction);

          //let pendingTransactions = [];

          //pendingTransactions.push(transactionJSON);

          dbo
            .collection("pendingTransaction")
            .insertOne({ transaction: transactionJSON }, function (err, res) {
              if (err) throw err;

              console.log("\nTransaction Inserted 💸\n".yellow.bold);

              let newBalance = balance - amount;

              let myquery = { user: username };

              let newvalues = { $set: { balance: newBalance } };
              dbo
                .collection("user")
                .updateOne(myquery, newvalues, function (err, res) {
                  if (err) throw err;

                  dbo
                    .collection("user")
                    .find({ user: addressTo })
                    .toArray(function (err, result) {
                      if (err) throw err;

                      let balanceNow = result[0].balance;

                      newBalance = Number(balanceNow) + Number(amount);

                      console.log(newBalance);

                      myquery = { user: addressTo };

                      newvalues = {
                        $set: { balance: newBalance },
                      };

                      dbo
                        .collection("user")
                        .updateOne(myquery, newvalues, function (err, res) {
                          if (err) throw err;
                          db.close();
                          console.log("Balance Uploaded 💰\n".yellow.bold);

                          const chain = new Blockchain(4);
                        });
                    });
                });
            });
        });
    });
  }
}

module.exports = Transaction;
