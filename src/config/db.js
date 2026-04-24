const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Intentamos conectar y capturamos cualquier error de forma limpia
pool.connect()
  .then(client => {
    console.log('Conexión exitosa a la base de datos PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('ERROR AL CONECTAR CON POSTGRESQL:');
    console.error(err.message);
    console.error('Por favor, revisa que las credenciales en tu archivo .env sean exactamente las de tu base de datos.');
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
};