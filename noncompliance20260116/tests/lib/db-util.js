import mysql from 'mysql2/promise';
import { context } from '../data/context.js';

async function dbQuery(script, db = 'sf360') {
  let connection = '';
  if (db == 'sf360')
    connection = await mysql.createConnection({
      host: context.TestConfig.dbHost,
      port: context.TestConfig.dbPort,
      user: context.TestConfig.dbUserName,
      password: context.TestConfig.dbUserPassword
    });
  else if (db == 'isps')
    connection = await mysql.createConnection({
      host: context.TestConfig.dbHostSR,
      port: context.TestConfig.dbPortSR,
      user: context.TestConfig.dbUserNameSR,
      password: context.TestConfig.dbUserPasswordSR
    });

  const results = await connection.execute(script);
  await connection.end();
  return results;
}

export { dbQuery };