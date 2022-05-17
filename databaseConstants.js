const { DataTypes } = require('sequelize');

const QUERYCODES =
{
  findAll : 0,
  create: 1,
  bulkCreate: 2
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

const fetchTeamIDByTeamName =
{
  attributes: ['team_id'],
  where: { team_name:{} }
}

const fetchTeamProfileByTeamID =
{
  attributes: ['team_id','team_name','logo','location','facebook','twitter','instagram','rank'],
  where: { team_id:{} }
}

const fetchRosterByTeamID =
{
  attributes: ['player_id','team_id','player_name','role','timeOnTeam','mapsPlayed'],
  where: { team_id:{} }
}

module.exports =
{
    QUERYCODES,
    tableOptions,
    teamDictionaryTableSchema,
    teamProfilesTableSchema,
    rosterTableSchema,
    fetchTeamIDByTeamName,
    fetchTeamProfileByTeamID,
    fetchRosterByTeamID
}