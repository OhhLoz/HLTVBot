const testConfig = require('./config.json');
const { Sequelize, Op } = require('sequelize');
const databaseConstants = require("./databaseConstants.js");
process.env.DATABASE_URL = testConfig.databaseURL;

const databaseClient = new Sequelize(process.env.DATABASE_URL,
{
  logging: false,
  dialectOptions:
  {
    ssl:
    {
      require: true,
      rejectUnauthorized: false
    }
  }
})

const testing = false;

if (testing)
{
  const { Client } = require('pg');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
    {
      rejectUnauthorized: false
    }
  });

  client.connect();
  client.query(`DROP TABLE roster;`, (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    client.end();
  });
}

// DEFINING TABLES USING DATA FROM DATABASECONSTANTS.JS
const teamDictionary = databaseClient.define('teamdictionary', databaseConstants.teamDictionaryTableSchema, databaseConstants.tableOptions);
const teamProfiles = databaseClient.define('teamprofiles', databaseConstants.teamProfilesTableSchema, databaseConstants.tableOptions);
const roster = databaseClient.define('roster', databaseConstants.rosterTableSchema, databaseConstants.tableOptions);

//roster.sync({ alter: true })

module.exports =
{
  async authenticate(log)
  {
    try
    {
      await databaseClient.authenticate();
      if(log)
        console.log('Database connection has been established successfully.');
      return true;
    }
    catch (error)
    {
      console.error('Unable to connect to the database:', error);
      return false;
    }
  },
  async queryHandler(model, attributes, queryCode)
  {
    let response;
    try
    {
      switch (queryCode)
      {
        case databaseConstants.QUERYCODES.findAll:
          response = await model.findAll(attributes);
          break;
        case databaseConstants.QUERYCODES.create:
          response = await model.create(attributes);
          break;
        case databaseConstants.QUERYCODES.bulkCreate:
          response = await model.bulkCreate(attributes);
          break;
      }

      if(response.dataValues != undefined)  // check if this code works if there is no result
      {
        //console.log(response.rows)
        return JSON.stringify(response.dataValues);
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
    var attributeTemplate = databaseConstants.fetchTeamIDByTeamName;
    attributeTemplate.where.team_name = { [Op.iLike]: teamName }
    return this.queryHandler(teamDictionary, attributeTemplate, databaseConstants.QUERYCODES.findAll);
  },
  async insertTeamDict(teamID, teamName)
  {
    return this.queryHandler(teamDictionary,
    {
      team_id: teamID,
      team_name: teamName
    },
    databaseConstants.QUERYCODES.create);
  },
  async checkTeamProfiles(teamID)
  {
    var attributeTemplate = databaseConstants.fetchTeamProfileByTeamID;
    attributeTemplate.where.team_id = { [Op.eq]: teamID.toString() }
    return this.queryHandler(teamProfiles, attributeTemplate, databaseConstants.QUERYCODES.findAll);
  },
  async insertTeamProfile(res)
  {
    return this.queryHandler(teamProfiles,
    {
      team_id: res.id,
      team_name: res.name,
      logo: res.logo,
      location: res.location,
      facebook: res.facebook,
      twitter: res.twitter,
      instagram: res.instagram,
      rank: res.rank
    },
    databaseConstants.QUERYCODES.create);
  },
  async checkRoster(teamID)
  {
    var attributeTemplate = databaseConstants.fetchRosterByTeamID;
    attributeTemplate.where.team_id = { [Op.eq]: teamID }
    return this.queryHandler(roster, attributeTemplate, databaseConstants.QUERYCODES.findAll);
  },
  async insertRoster(rosterArr, teamID)
  {
    for(var rosterMember of rosterArr)
    {
      rosterMember.team_id = teamID.toString();
    }
    return this.queryHandler(roster, rosterArr, databaseConstants.QUERYCODES.bulkCreate);
  },
}