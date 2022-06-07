const { Sequelize, Op } = require('sequelize');
const databaseConstants = require("./databaseConstants.js");
// const testConfig = require('./config.json');
// process.env.DATABASE_URL = testConfig.databaseURL;

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
  var truncateAll = `TRUNCATE TABLE teamstats,teammaps,teamprofiles, roster;`
  var truncate = `TRUNCATE TABLE teammaps;`
  var drop = `DROP TABLE player;`
  var update = `UPDATE teamdictionary SET team_id = '4608' where team_name = 'navi';`
  client.query(drop, (err, res) => {
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
const players = databaseClient.define('players', databaseConstants.playersTableSchema, databaseConstants.tableOptions);

//players.sync({ alter: true })

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
        case databaseConstants.QUERYCODES.bulkUpdate:
          response = await model.bulkCreate(attributes[0], attributes[1]);
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
    res,
    databaseConstants.QUERYCODES.create);
  },
  async handleTeamProfileUpdate(res, dbDate)
  {
    this.isExpired(dbDate, databaseConstants.expiryTime.teamprofiles).then((result) =>
    {
      if(result)
      {
        this.updateTeamProfile(res);
        this.updateRoster(res.players, res.team_id);
      }
    });
  },
  async updateTeamProfile(res)
  {
    return this.queryHandler(teamProfiles,
    ([res, {where: {team_id: res.team_id}}]),
    databaseConstants.QUERYCODES.update);
  },
  async checkUpdateTeamProfile(res)
  {
    this.fetchTeamProfiles(res.team_id).then((teamProfilesResult) =>
    {
        if (teamProfilesResult == undefined)
        {
          this.insertTeamProfile(res);
          this.insertRoster(res.players, res.team_id);
        }
        else
            this.handleTeamProfilesUpdate(res, new Date(teamProfilesResult.updated_at))
    });
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
    res,
    databaseConstants.QUERYCODES.create);
  },
  async updateTeamStats(res)
  {
    return this.queryHandler(teamStats,
    ([res, {where: {team_id: res.team_id}}]),
    databaseConstants.QUERYCODES.update);
  },
  async handleTeamStatsUpdate(res, dbDate)
  {
    this.isExpired(dbDate, databaseConstants.expiryTime.teamstats).then((result) =>
    {
      if(result)
        this.updateTeamStats(res);
    });
  },
  async checkUpdateTeamStats(res)
  {
    this.fetchTeamStats(res.team_id).then((teamStatsResult) =>
    {
        if (teamStatsResult == undefined)
            this.insertTeamStats(res);
        else
            this.handleTeamStatsUpdate(res, new Date(teamStatsResult.updated_at))
    });
  },
  async fetchTeamMaps(teamID)
  {
    var attributeTemplate = databaseConstants.fetchTeamMapsByTeamID;
    attributeTemplate.where.team_id = { [Op.eq]: teamID }
    return this.queryHandler(teamMaps, attributeTemplate, databaseConstants.QUERYCODES.findAll);
  },
  async insertTeamMaps(mapArr)
  {
    return this.queryHandler(teamMaps, mapArr, databaseConstants.QUERYCODES.bulkCreate);
  },
  async updateTeamMaps(mapArr, teamID, teamName)
  {
    // return this.queryHandler(teamMaps,
    // [mapArr,
    // {
    //   fields: databaseConstants.fetchTeamMapsByTeamID.attributes,
    //   updateOnDuplicate: ['wins','draws','losses','winRate','totalRounds','roundWinPAfterFirstKill','roundWinPAfterFirstDeath','updated_at']
    // }],
    // databaseConstants.QUERYCODES.bulkUpdate);
    await this.queryHandler(teamMaps, {where: {team_id: teamID}}, databaseConstants.QUERYCODES.delete);
    await this.insertTeamMaps(mapArr);
  },
  async handleTeamMapsUpdate(mapArr, teamID, teamName, dbDate)
  {
    this.isExpired(dbDate, databaseConstants.expiryTime.teammaps).then((result) =>
    {
      if(result)
        this.updateTeamMaps(mapArr, teamID, teamName);
    });
  },
  async checkUpdateTeamMaps(res)
  {
    this.fetchTeamMaps(res.team_id).then((teamMapsResult) =>
    {
        if (teamMapsResult.length == 0)
            this.insertTeamMaps(res);
        else
            this.handleTeamMapsUpdate(res, new Date(teamMapsResult.updated_at))
    });
  },
  async fetchPlayer(IGN)
  {
    var attributeTemplate = databaseConstants.fetchPlayerByIGN;
    attributeTemplate.where.ign = { [Op.iLike]: IGN }
    return this.queryHandler(players, attributeTemplate, databaseConstants.QUERYCODES.findOne);
  },
  async insertPlayer(res)
  {
    return this.queryHandler(players,
    res,
    databaseConstants.QUERYCODES.create);
  },
  async handlePlayerUpdate(res, dbDate)
  {
    this.isExpired(dbDate, databaseConstants.expiryTime.players).then((result) =>
    {
      if(result)
        this.updatePlayer(res);
    });
  },
  async updatePlayer(res)
  {
    return this.queryHandler(players,
    ([res, {where: {id: res.id}}]),
    databaseConstants.QUERYCODES.update);
  },
  async checkUpdatePlayer(res)
  {
    this.fetchPlayer(res.ign).then((playerResult) =>
    {
        if (playerResult == undefined)
        {
          this.insertPlayer(res);
        }
        else
            this.handlePlayerUpdate(res, new Date(playerResult.updated_at))
    });
  },
  async isExpired(dbDate, expiryTime)
  {
    var dateMilliDifference = Date.now() - dbDate.getTime();
    if (dateMilliDifference > expiryTime)
        return true;
    return false;
  }
}