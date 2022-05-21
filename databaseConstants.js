const { DataTypes } = require('sequelize');

const QUERYCODES =
{
  findAll : 0,
  create: 1,
  bulkCreate: 2,
  delete: 3,
  update: 4,
  findOne : 5
}

// expiryTime in milliseconds
const msinMinutes = 60 * 1000;
const expiryTime =
{
  teamdictionary: 600 * msinMinutes,
  teamprofiles: 60 * msinMinutes,
  teamstats: 60 * msinMinutes
}

const tableOptions =
{
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
}

const teamDictionaryTableSchema =
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
}

const teamProfilesTableSchema =
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
}

var teamProfilesFields = (res) =>
{
  return {
    team_id: res.id,
    team_name: res.name,
    logo: res.logo,
    location: res.country.name,
    facebook: res.facebook,
    twitter: res.twitter,
    instagram: res.instagram,
    rank: res.rank
  }
}

const rosterTableSchema =
{
    field_id:
    {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    id:
    {
        type: DataTypes.STRING,
        allowNull: false
    },
    team_id:
    {
        type: DataTypes.STRING,
        allowNull: false
    },
    name:
    {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {type: DataTypes.STRING},
    timeOnTeam: {type: DataTypes.STRING},
    mapsPlayed: {type: DataTypes.STRING}
}

const teamStatsTableSchema =
{
    team_id:
    {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    team_name:{type: DataTypes.STRING},
    kills:{type: DataTypes.INTEGER},
    deaths:{type: DataTypes.INTEGER},
    kdRatio:{type: DataTypes.FLOAT},
    wins:{type: DataTypes.INTEGER},
    losses:{type: DataTypes.INTEGER},
    mapsPlayed:{type: DataTypes.INTEGER},
    roundsPlayed:{type: DataTypes.INTEGER}
}

var teamStatsFields = (res) =>
{
  return {
    team_id: res.id,
    team_name: res.name,
    wins: res.overview.wins,
    losses: res.overview.losses,
    kills: res.overview.totalKills,
    deaths: res.overview.totalDeaths,
    kdRatio: res.overview.kdRatio,
    roundsPlayed: res.overview.roundsPlayed,
    mapsPlayed: res.overview.mapsPlayed
  }
}

const teamMapsTableSchema =
{
  id:
  {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  team_id:
  {
      type: DataTypes.STRING,
      allowNull: false
  },
  map_name:{type: DataTypes.STRING},
  team_name:{type: DataTypes.STRING},
  wins:{type: DataTypes.INTEGER},
  draws:{type: DataTypes.INTEGER},
  losses:{type: DataTypes.FLOAT},
  winRate:{type: DataTypes.FLOAT},
  totalRounds:{type: DataTypes.INTEGER},
  roundWinPAfterFirstKill:{type: DataTypes.FLOAT},
  roundWinPAfterFirstDeath:{type: DataTypes.FLOAT}
}

const fetchTeamIDByTeamName =
{
  attributes: ['team_id', 'updated_at'],
  where: { team_name:{} }
}

const fetchTeamProfileByTeamID =
{
  attributes: ['team_id','team_name','logo','location','facebook','twitter','instagram','rank', 'updated_at'],
  where: { team_id:{} }
}

const fetchRosterByTeamID =
{
  attributes: ['id','team_id','name','type','timeOnTeam','mapsPlayed'],
  where: { team_id:{} }
}

const fetchTeamStatsByTeamID =
{
  attributes: ['team_id','team_name','kills','deaths','kdRatio','wins','losses','mapsPlayed','roundsPlayed','updated_at'],
  where: { team_id:{} }
}

const fetchMapStatsByTeamID =
{
  attributes: ['team_id','team_name','map_name','wins','draws','losses','winRate','totalRounds','roundWinPAfterFirstKill','roundWinPAfterFirstDeath','updated_at'],
  where: { team_id:{} }
}

module.exports =
{
  QUERYCODES,
  expiryTime,
  tableOptions,
  teamDictionaryTableSchema,
  teamProfilesTableSchema,
  teamProfilesFields,
  rosterTableSchema,
  teamStatsTableSchema,
  teamStatsFields,
  teamMapsTableSchema,
  fetchTeamIDByTeamName,
  fetchTeamProfileByTeamID,
  fetchRosterByTeamID,
  fetchTeamStatsByTeamID,
  fetchMapStatsByTeamID
}