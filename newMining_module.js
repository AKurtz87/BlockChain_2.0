const crypto = require("crypto");

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";

const colors = require("colors");
colors.setTheme({
  green: "green",
  bgCyan: "bgCyan",
  yellow: "yellow",
  bgBlue: "bgBlue",
  blue: "blue",
  bold: "bold",
  red: "red",
});

class Blockchain {
  constructor(difficulty) {
    this.nonce = 0;
    this.difficulty = difficulty;
    this.blockchain = this.processPendingTransaction();
  }

  //let rHash = generateRandomHash(64);

  //console.log(rHash);

  //------------------------------------------------------------------------------------------------------------//

  // CHECK FOR NEW RANSACTION AND PUSH ALL NEW TRANSACTIONS IN PENDING TRANSACTION ARRAY
  processPendingTransaction = function () {
    // RANDOM HASH FUNCTION, TO GENERATE FIRST BLOCKCHAIN HASH
    function generateRandomHash(stringLength) {
      var result = "";
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < stringLength; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }

      let randomHash = crypto.createHash("sha256").update(result).digest("hex");
      return randomHash;
    }

    let pendingTransaction = [];
    let nonce = 0;

    // FUNCTION TO GENERATE BLOCKCHAIN HASH
    function blockchainHash(previousHash, newData) {
      let blockHash = crypto
        .createHash("sha256")
        .update(previousHash + newData)
        .digest("hex");
      return blockHash;
    }

    // MINING BLOCK FUNCTION
    function mineBlock(blockHash, difficulty) {
      while (
        blockHash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
      ) {
        nonce++;
        blockHash = blockchainHash(blockHash, nonce);
      }
      let proof = blockHash;
      return proof;
    }

    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      const dbo = db.db("blockchain");
      dbo
        .collection("pendingTransaction")
        .find({})
        .toArray(function (err, result) {
          if (err) throw err;

          let transactionArray = result;

          let transactionToProcess = result.length;

          if (result.length === 0) {
            console.log("No transaction to process!");
          } else {
            console.log(
              transactionToProcess +
                " new transactions to process!\n\nStarting process...\n".green
                  .bold
            );
            for (let i = 0; i <= transactionToProcess - 1; i++) {
              let stringTransaction = JSON.stringify(transactionArray[i]);
              pendingTransaction.push(stringTransaction);
              //console.log(i);
              //console.log(pendingTransaction);
            }
          }

          console.log(
            "New transactions processed, ready to generate block!\n".green.bold
          );

          dbo
            .collection("blockHash")
            .find({})
            .toArray(function (err, result) {
              if (err) throw err;

              //console.log(result.length);

              if (result.length === 0) {
                dbo
                  .collection("blockHash")
                  .insertOne(
                    { block: generateRandomHash() },
                    function (err, res) {
                      if (err) throw err;
                      console.log("First Random Hash Added #️⃣\n".yellow.bold);
                    }
                  );
              }

              dbo
                .collection("blockHash")
                .find({})
                .toArray(function (err, result) {
                  if (err) throw err;

                  let lastBlock = result[result.length - 1].blockHash;

                  let newBlock = blockchainHash(lastBlock, pendingTransaction);

                  //console.log(newBlock);

                  dbo
                    .collection("blockHash")
                    .insertOne({ block: newBlock }, function (err, res) {
                      if (err) throw err;
                      console.log("New Block Inserted 🅱️\n".yellow.bold);

                      //let mined = mineBlock(newBlock, 4);

                      dbo
                        .collection("proofHash")
                        .insertOne(
                          { proof: mineBlock(newBlock, 4) },
                          function (err, res) {
                            if (err) throw err;
                            console.log("New BlockProof Mined ⛏\n".yellow.bold);

                            for (let i = 0; i < transactionToProcess; i++) {
                              dbo.collection("transaction").insertOne(
                                {
                                  transaction: transactionArray[i].transaction,
                                },
                                function (err, res) {
                                  if (err) throw err;

                                  dbo
                                    .collection("pendingTransaction")
                                    .deleteMany({}, function (err, obj) {
                                      if (err) throw err;
                                      db.close();
                                    });
                                }
                              );
                            }
                          }
                        );
                    });
                });
            });
        });
    });
  };
}

module.exports = Blockchain;
