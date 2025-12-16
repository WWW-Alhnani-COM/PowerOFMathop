import mysql from 'mysql2/promise';

export async function query({ query, values = [] }) {
  const dbconnection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'power_of_math',
  });

  try {
    const [results] = await dbconnection.execute(query, values);
    dbconnection.end();
    return results;
  } catch (error) {
    throw Error(error.message);
  }
}