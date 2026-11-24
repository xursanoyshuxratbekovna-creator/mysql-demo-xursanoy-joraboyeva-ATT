import mysql from "mysql2/promise";

function getPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || "test",
    waitForConnections: true,
    connectionLimit: 5,
    ssl: {
      rejectUnauthorized: true,
    },
  });
}

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  let pool;
  try {
    pool = getPool();

    if (event.httpMethod === "GET") {
      const [rows] = await pool.query(
        "SELECT id, name, created_at FROM notes ORDER BY id DESC"
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(rows),
      };
    }

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");
      const name = (data.name || "").trim();

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Ism bo'sh bo'lmasligi kerak" }),
        };
      }

      const [result] = await pool.query(
        "INSERT INTO notes (name) VALUES (?)",
        [name]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          id: result.insertId,
          name,
          message: "Saqlandi",
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (err) {
    console.error("API error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Server xatosi" }),
    };
  } finally {
    if (pool) {
      await pool.end().catch(() => {});
    }
  }
}
