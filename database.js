const testConfig = require('./config.json');
const { Sequelize, DataTypes, Op } = require('sequelize');
process.env.DATABASE_URL = testConfig.databaseURL;

const QUERYCODES =
{
  findAll : 0,
  create: 1
}

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

const teamDictionary = databaseClient.define('teamDictionary',
{
  id:
  {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  team_id:
  {
    type: DataTypes.STRING,
    allowNull: false
  },
  team_name:
  {
    type: DataTypes.STRING,
    allowNull: false
  }
},
{
  tableName: 'teamdictionary',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const teamProfiles = databaseClient.define('teamProfiles',
{
  team_id:
  {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  team_name:{type: DataTypes.STRING},
  logo:{type: DataTypes.STRING},
  location:{type: DataTypes.STRING},
  facebook:{type: DataTypes.STRING},
  twitter:{type: DataTypes.STRING},
  instagram:{type: DataTypes.STRING},
  rank:{type: DataTypes.STRING}
},
{
  tableName: 'teamprofiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const fetchTeamIDByTeamName =
{
  attributes: ['team_id'],
  where:
  {
    team_name:
    {
    }
  }
}

const fetchTeamProfileByTeamID =
{
  attributes: ['team_id','team_name','logo','location','facebook','twitter','instagram','rank'],
  where:
  {
    team_id:
    {
    }
  }
}


//teamProfiles.sync({ alter: true })

module.exports =
{
  async authenticate()
  {
    try
    {
      await databaseClient.authenticate();
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
        case QUERYCODES.findAll:
          response = await model.findAll(attributes);
          break;
        case QUERYCODES.create:
          response = await model.create(attributes);
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
    var attributeTemplate = fetchTeamIDByTeamName;
    attributeTemplate.where.team_name = { [Op.iLike]: teamName }
    return this.queryHandler(teamDictionary, attributeTemplate, QUERYCODES.findAll);
  },
  async insertTeamDict(teamID, teamName)
  {
    return this.queryHandler(teamDictionary,
    {
      team_id: teamID,
      team_name: teamName
    },
    QUERYCODES.create);
  },
  async checkTeamProfiles(teamID)
  {
    var attributeTemplate = fetchTeamProfileByTeamID;
    attributeTemplate.where.team_id = { [Op.eq]: teamID.toString() }
    return this.queryHandler(teamProfiles, attributeTemplate, QUERYCODES.findAll);
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
    QUERYCODES.create);
  }
}