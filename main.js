const colors = require("colors");
colors.setTheme({
  bgGreen: "bgGreen",
  bgCyan: "bgCyan",
  yellow: "yellow",
  bgBlue: "bgBlue",
  blue: "blue",
  red: "red",
  bold: "bold",
});

const prompt = require("prompt");

const Transaction = require("./newTransaction");

prompt.message = "";
prompt.delimiter = " ";

prompt.get(
  {
    properties: {
      username: {
        description: colors.yellow.bold(
          "\nPlease insert username and password\n\nWhat is your username?"
        ),
      },
      password: {
        description: colors.red.bold("\nWhat is your password?"),
      },
      amount: {
        description: colors.yellow.bold(
          "\nHow much is the amount of this transaction?"
        ),
      },
      addressTo: {
        description: colors.yellow.bold("\nWho is the receiver?"),
      },
    },
  },
  function (err, result) {
    if (
      !result.username ||
      !result.password ||
      !result.amount ||
      !result.addressTo
    ) {
      console.log("\nEmpty fileds not allowed!\n".red.bold);
      return console.log("error");
    }

    let user = result.username;
    let password = result.password;
    let amount = result.amount;
    let addressTo = result.addressTo;

    const tx = new Transaction(user, password, amount, addressTo);
  }
);
