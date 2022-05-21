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

if (false)
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
  client.query(`TRUNCATE TABLE teamstats;`, (err, res) => {
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
const teamStats = databaseClient.define('teamstats', databaseConstants.teamStatsTableSchema, databaseConstants.tableOptions);
const teamMaps = databaseClient.define('teammaps', databaseConstants.teamMapsTableSchema, databaseConstants.tableOptions);

//teamStats.sync({ alter: true })

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
        case databaseConstants.QUERYCODES.delete:
          response = await model.destroy(attributes);
          break;
        case databaseConstants.QUERYCODES.update:
          response = await model.update(attributes[0], attributes[1]);
          break;
        case databaseConstants.QUERYCODES.findOne:
          response = await model.findOne(attributes);
          break;
      }
      return response;
    }
    catch (err)
    {
      console.log(err)
    }
  },
  async fetchTeamDict(teamName)
  {
    var attributeTemplate = databaseConstants.fetchTeamIDByTeamName;
    attributeTemplate.where.team_name = { [Op.iLike]: teamName }
    return this.queryHandler(teamDictionary, attributeTemplate, databaseConstants.QUERYCODES.findOne);
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
  async updateTeamDict(teamID, teamName)
  {
    return this.queryHandler(teamProfiles,
    ([{
      team_id: teamID,
      team_name: teamName
    }, {where: {team_id: teamID}}]),
    databaseConstants.QUERYCODES.update);
  },
  async handleTeamDictUpdate(teamID, teamName, dbDate)
  {
    //var dateMilliDifference = new Date(new Date().toUTCString().substr(0, 25)).getTime() - new Date(dbDate.toUTCString().substr(0, 25)).getTime();
    var dateMilliDifference = Date.now() - dbDate.getTime();
    if (dateMilliDifference > databaseConstants.expiryTime.teamdictionary)
    {
        this.updateTeamDict(teamID, teamName);
    }
  },
  async fetchTeamProfiles(teamID)
  {
    var attributeTemplate = databaseConstants.fetchTeamProfileByTeamID;
    attributeTemplate.where.team_id = { [Op.eq]: teamID.toString() }
    return this.queryHandler(teamProfiles, attributeTemplate, databaseConstants.QUERYCODES.findOne);
  },
  async insertTeamProfile(res)
  {
    return this.queryHandler(teamProfiles,
    databaseConstants.teamProfilesFields(res),
    databaseConstants.QUERYCODES.create);
  },
  async handleTeamProfileUpdate(res, dbDate)
  {
    //var dateMilliDifference = new Date(new Date().toUTCString().substr(0, 25)).getTime() - new Date(dbDate.toUTCString().substr(0, 25)).getTime();
    var dateMilliDifference = Date.now() - dbDate.getTime();
    if (dateMilliDifference > databaseConstants.expiryTime.teamprofiles)
    {
        this.updateRoster(res.players, res.id);
        this.updateTeamProfile(res);
    }
  },
  async updateTeamProfile(res)
  {
    return this.queryHandler(teamProfiles,
    ([databaseConstants.teamProfilesFields(res), {where: {team_id: res.id}}]),
    databaseConstants.QUERYCODES.update);
  },
  async fetchRoster(teamID)
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
  async updateRoster(rosterArr, teamID)
  {
    await this.queryHandler(roster, {where: {team_id: teamID}}, databaseConstants.QUERYCODES.delete);
    await this.insertRoster(rosterArr, teamID);
  },
  async fetchTeamStats(teamID)
  {
    var attributeTemplate = databaseConstants.fetchTeamStatsByTeamID;
    attributeTemplate.where.team_id = { [Op.eq]: teamID.toString() }
    return this.queryHandler(teamStats, attributeTemplate, databaseConstants.QUERYCODES.findOne);
  },
  async insertTeamStats(res)
  {
    return this.queryHandler(teamStats,
    databaseConstants.teamStatsFields(res),
    databaseConstants.QUERYCODES.create);
  },
  async updateTeamStats(res)
  {
    return this.queryHandler(teamStats,
    ([databaseConstants.teamStatsFields(res), {where: {team_id: res.id}}]),
    databaseConstants.QUERYCODES.update);
  },
  async handleTeamStatsUpdate(res, dbDate)
  {
    //var dateMilliDifference = new Date(new Date().toUTCString().substr(0, 25)).getTime() - new Date(dbDate.toUTCString().substr(0, 25)).getTime();
    var dateMilliDifference = Date.now() - dbDate.getTime();
    if (dateMilliDifference > databaseConstants.expiryTime.teamstats)
    {
        this.updateTeamStats(res);
    }
  }
}