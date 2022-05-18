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
  client.query(`TRUNCATE TABLE roster;`, (err, res) => {
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
        case databaseConstants.QUERYCODES.delete:
          response = await model.destroy(attributes);
          break;
        case databaseConstants.QUERYCODES.update:
          response = await model.update(attributes[0], attributes[1]);
          break;
      }

      if(response[0] != undefined)  // checks if there is a response
      {
        //console.log(response)
        return response;
      }
      return undefined;
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
  async fetchTeamProfiles(teamID)
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
      location: res.country.name,
      facebook: res.facebook,
      twitter: res.twitter,
      instagram: res.instagram,
      rank: res.rank
    },
    databaseConstants.QUERYCODES.create);
  },
  async handleTeamProfile(res)
  {
    this.fetchTeamProfiles(res.id).then((result) =>
    {
        if (result == undefined)
        {
          this.insertTeamProfile(res);
          this.insertRoster(res.players, res.id);
        }
        else
        {
          var dbDate = new Date(result.updated_at);
          //var dateMilliDifference = new Date(new Date().toUTCString().substr(0, 25)).getTime() - new Date(dbDate.toUTCString().substr(0, 25)).getTime();
          var dateMilliDifference = Date.now() - dbDate.getTime();
          if (dateMilliDifference > databaseConstants.expiryTime.teamprofiles)
          {
              //update teamprofiles & roster
              this.updateRoster(res.players, res.id);
              this.updateTeamProfile(res);
          }
        }
    });
  },
  async updateTeamProfile(res)
  {
    return this.queryHandler(teamProfiles,
    ([{
      team_id: res.id,
      team_name: res.name,
      logo: res.logo,
      location: res.country.name,
      facebook: res.facebook,
      twitter: res.twitter,
      instagram: res.instagram,
      rank: res.rank
    }, {where: {team_id: res.id}}]),
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
    this.insertRoster(rosterArr, teamID);
  }
}