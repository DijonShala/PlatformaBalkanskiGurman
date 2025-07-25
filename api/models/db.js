import dotenv from 'dotenv';
import pg from 'pg';
import { Sequelize } from 'sequelize';

dotenv.config();

const { Pool } = pg;

let dbURI = '';
if (process.env.NODE_ENV === 'production') {
  dbURI = process.env.RENDER_POSTGRES_URI || '';
} else {
  dbURI = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
}

const pool = new Pool({
  connectionString: dbURI,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

const sequelize = new Sequelize(dbURI, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

pool.on('connect', () => {
  console.log('Connection pool established with DB');
});

pool.on('error', (err, client) => {
  console.error('error on idle client', err);
  process.exit(-1);
});

pool.on('remove', () => {
  console.log('client was removed from pool');
});

const gracefulShutdown = async (msg, callback) => {
  try {
    await pool.end();
    console.log(`PostgreSQL pool disconnected through ${msg}.`);
    callback();
  } catch (err) {
    console.error('Error during pool shutdown', err);
    callback(err);
  }
};

process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () =>
    process.kill(process.pid, 'SIGUSR2')
  );
});

process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => process.exit(0));
});

process.on('SIGTERM', () => {
  gracefulShutdown('Cloud-based app shutdown', () => process.exit(0));
});

export { pool, sequelize };
