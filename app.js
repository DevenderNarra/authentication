const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();

const dbPath = path.join(__dirname + "userData.db");
let db = null;
const initializeServerAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server run at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
};
initializeServerAndDb();

app.post("/register/", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt(password, 10);
    const getRegisterQuery = `SELECT * FROM user WHERE username='${username}';`;
    const dbUser = await db.get(getRegisterQuery);
    if (dbUser === undefined) {
      const createUserQuery = `INSERT INTO user(username,name,password,gender,location)
        VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      const dbResponse = await db.run(createUserQuery);
      response.status(200);
      response.send("User Created Successfully");
    } else if (hashedPassword.length() < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

app.post("/login/", async (request, response) => {
  try {
    const { username, password } = request.body;
    console.log(`${password}`);
    const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        response.send("Login success");
      } else {
        response.status(400);
        response.send("Invalid Password");
      }
    }
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});

app.put("/change-password/", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const getUserQuery = `SELECT * FROM user WHERE username='${username}';`;
    const dbUser = await db.get(getUserQuery);
    if (dbUser.password !== oldPassword) {
      response.status(400);
      response.send("Invalid current password");
    } else if (newPassword.length() < 5) {
      response.send(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `UPDATE user SET password='${newPassword}' WHERE username='${username}';`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password Updated");
    }
  } catch (e) {
    console.log(`Error:${e.message}`);
  }
});
module.exports = app;
