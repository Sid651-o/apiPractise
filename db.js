const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",          // your PostgreSQL username
  host: "localhost",
  database: "taskdb",        // the DB you just created
  password: "postgreSQL_DB", // the password you entered in pgAdmin
  port: 5432,
});

module.exports = pool;
