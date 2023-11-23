var express = require("express");
var router = express.Router();
app = express();

const mysql = require("mysql2");

var connection = mysql.createConnection({
  host: "172.22.144.1",
  port: "3306",
  user: "root",
  password: "nostale12",
});
connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});
connection.query("USE korean_webapp");

const currentDate = new Date().toISOString().split("T")[0];
router.get("/get-new", (req, res) => {
  var last_item_id;
  if (!req.user) res.send("user not logged in");
  else {
    connection.query(
      "SELECT * from flashcards WHERE user_ref_id = " +
        req.user.user_id +
        " ORDER BY flashcard_id DESC LIMIT 1",
      function (err, rows) {
        if (!rows.length) last_item_id = 0;
        else last_item_id = rows[0].vocabulary_item_ref_id;
        console.log(last_item_id);
        connection.query(
          "SELECT * from vocabulary ORDER BY item_id ASC LIMIT " +
            last_item_id +
            ", 10",
          function (err, rows) {
            for (let i = 0; i < rows.length; i++) {
              connection.query(
                "INSERT INTO flashcards (due_date, priority, vocabulary_item_ref_id, user_ref_id) VALUES ('" +
                  currentDate +
                  "', -1, " +
                  rows[i].item_id +
                  ", " +
                  req.user.user_id +
                  ")",
                function (err, rows) {
                  if (err) console.log(err);
                }
              );
            }
          }
        );
      }
    );
    res.send("items added");
  }
});

router.get("/get-due", (req, res) => {
  if (!req.user) res.send("user not logged in");
  else {
    connection.query(
      "SELECT * from flashcards WHERE user_ref_id = " +
        req.user.user_id +
        " AND due_date = '" +
        currentDate +
        "'",
      function (err, rows) {
        if (rows.length) res.json(rows);
        else res.send("no items due today");
      }
    );
  }
});

router.get("/get-learning", (req, res) => {
  if (!req.user) res.send("user not logged in");
  else {
    connection.query(
      "SELECT * from flashcards WHERE user_ref_id = " +
        req.user.user_id +
        " AND priority = -1",
      function (err, rows) {
        if (rows.length) res.json(rows);
        else res.send("no items in learning");
      }
    );
  }
});

router.post("/succeed-card", (req, res) => {
  if (!req.user) res.send("user not logged in");
  else {
    connection.query(
      "SELECT * from flashcards WHERE user_ref_id = " +
        req.user.user_id +
        " AND flashcard_id = " +
        req.body.flashcard_id +
        "",
      function (err, rows) {
        if (rows.length) {
          var priority = rows[0].priority + 1;
          //TODO set due date due to priority
          var dueDate = currentDate;
          connection.query(
            "UPDATE flashcards SET priority = " +
              priority +
              ", due_date ='" +
              dueDate +
              "' WHERE flashcard_id = " +
              req.body.flashcard_id +
              "",
            function (err, res) {}
          );
        } else res.send("no item with that flashcard_id");
      }
    );
  }
  res.send("card succeeded");
});

router.post("/fail-card", (req, res) => {
  if (!req.user) res.send("user not logged in");
  else {
    connection.query(
      "SELECT * from flashcards WHERE user_ref_id = " +
        req.user.user_id +
        " AND flashcard_id = " +
        req.body.flashcard_id +
        "",
      function (err, rows) {
        if (rows.length) {
          var priority = rows[0].priority - 1;
          //TODO set due date due to priority
          var dueDate = currentDate;
          connection.query(
            "UPDATE flashcards SET priority = " +
              priority +
              ", due_date ='" +
              dueDate +
              "' WHERE flashcard_id = " +
              req.body.flashcard_id +
              "",
            function (err, res) {}
          );
        } else res.send("no item with that flashcard_id");
      }
    );
  }
  res.send("card succeeded");
});

module.exports = router;