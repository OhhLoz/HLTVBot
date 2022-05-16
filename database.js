const { Client } = require('pg');
const testConfig = require('./config.json');
//const { Sequelize } = require('sequelize');
process.env.DATABASE_URL = testConfig.databaseURL;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl:
  {
    rejectUnauthorized: false
  }
});

//const databaseClient = new Sequelize(process.env.DATABASE_URL)

//client.connect();

// client.query(`CREATE TABLE teamprofiles (
// 	team_id VARCHAR ( 10 ) PRIMARY KEY,
// 	team_name VARCHAR ( 100 ) UNIQUE NOT NULL,
// 	logo VARCHAR ( 255 ),
// 	location VARCHAR ( 20 ),
// 	facebook VARCHAR ( 100 ),
// 	twitter VARCHAR ( 100 ),
// 	instagram VARCHAR ( 100 ),
// 	rank VARCHAR ( 10 ),
//   created_at TIMESTAMP NOT NULL,
//   updated_at TIMESTAMP
// );`, (err, res) => {
//     if (err) throw err;
//     for (let row of res.rows) {
//       console.log(JSON.stringify(row));
//     }
//     client.end();
// });

// client.query(`TRUNCATE TABLE teamprofiles;`, (err, res) => {
//   if (err) throw err;
//   for (let row of res.rows) {
//     console.log(JSON.stringify(row));
//   }
//   client.end();
// });
module.exports =
{
  async connect()
  {
    await client.connect();
  },
  async queryHandler(query)
  {
    let response;
    try
    {
      response = await client.query(query);
      if(response.rows.length != 0)
      {
        //console.log(response.rows)
        return JSON.stringify(response.rows[0]);
      }
      return undefined;
    }
    catch (err)
    {
      console.log(err)
    }
  },
  async checkTeamDict(teamName)
  {
    return this.queryHandler(`SELECT team_id FROM teamdictionary WHERE team_name ILIKE '${teamName}';`);
  },
  async insertTeamDict(teamID, teamName)
  {
    return this.queryHandler(`INSERT INTO teamDictionary(team_id, team_name, created_at, updated_at) VALUES ('${teamID}','${teamName}',to_timestamp(${Date.now()} / 1000.0), to_timestamp(${Date.now()} / 1000.0));`);
  },
  async checkTeamProfiles(teamID)
  {
    return this.queryHandler(`SELECT (team_id, team_name, logo, location, facebook, twitter, instagram, rank) FROM teamprofiles WHERE team_id = '${teamID}'; `);
  },
  async insertTeamProfile(res)
  {
    return this.queryHandler(`INSERT INTO teamprofiles(team_id, team_name, logo, location, facebook, twitter, instagram, rank, created_at, updated_at) VALUES ('${res.id}','${res.name}','${res.logo}','${res.location}','${res.facebook}','${res.twitter}','${res.instagram}','${res.rank}',to_timestamp(${Date.now()} / 1000.0),to_timestamp(${Date.now()} / 1000.0))`);
  }
}