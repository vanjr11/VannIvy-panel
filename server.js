require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");

const app = express();
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(session({
  secret: "zeinovan-secret",
  resave: false,
  saveUninitialized: false
}));

function isAuth(req,res,next){
  if(req.session.user) next();
  else res.redirect("/");
}

app.get("/", (req,res)=>{
  res.send(`
    <h2>Zeinovan Panel Login</h2>
    <form method="POST">
      <input name="username" placeholder="Username"/><br><br>
      <input type="password" name="password" placeholder="Password"/><br><br>
      <button>Login</button>
    </form>
  `);
});

app.post("/", async (req,res)=>{
  const { username, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE username=$1 AND password=$2",
    [username,password]
  );

  if(result.rows.length > 0){
    req.session.user = username;
    res.redirect("/dashboard");
  } else {
    res.send("Login Failed");
  }
});

app.get("/dashboard", isAuth, async (req,res)=>{
  const user = await pool.query(
    "SELECT balance FROM users WHERE username=$1",
    [req.session.user]
  );

  res.send(`
    <h2>Welcome ${req.session.user}</h2>
    <p>Balance: $${user.rows[0].balance}</p>
    <a href="/logout">Logout</a>
  `);
});

app.get("/logout",(req,res)=>{
  req.session.destroy();
  res.redirect("/");
});

app.listen(3000, ()=>console.log("Running..."));