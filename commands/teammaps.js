const { SlashCommandBuilder } = require("@discordjs/builders");
const { HLTV } = require('hltv');
const func = require("../functions.js")
const database = require("../databaseWrapper.js")
const conv = require("../databaseConverters.js")

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("teammaps")
		.setDescription("Displays the map statistics related to the input team")
    .addStringOption(option => option.setName('teamname').setDescription('Team to display the map statistics for').setRequired(true)),
	async execute(interaction, client, botData)
  {
    var teamName = interaction.options.getString('teamname');

    database.fetchTeamDict(teamName).then(teamDictResult =>
    {
      if (teamDictResult == undefined)    //if teamid not found in teamDictionary
      {
        HLTV.getTeamByName({name: teamName}).then((res)=>
        {
            database.insertTeamDict(res.id, res.name);
            if (teamName.toLowerCase() != res.name.toLowerCase())
                database.insertTeamDict(res.id, teamName);

            database.checkUpdateTeamProfile(res);
            HLTV.getTeamStats({id: res.id}).then((res)=>
            {
                database.insertTeamMaps(conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name));
                func.handleTeamMaps(interaction, conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name), res.id, res.name, botData);

                database.checkUpdateTeamStats(res);
            });
        }).catch((err) =>
        {
            console.log(err);
            interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TM1", "Error whilst accessing HLTV API using provided team name", botData)] });
        });
      }
      else
      {
        database.fetchTeamMaps(teamDictResult.team_id).then((teamMapsResult) =>
        {
          if (teamMapsResult.length == 0)
          {
            HLTV.getTeamStats({id: teamDictResult.team_id}).then((res)=>
            {
                database.insertTeamMaps(conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name));
                func.handleTeamMaps(interaction, conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name), res.id, res.name, botData)
                database.checkUpdateTeamStats(res);
            }).catch((err) =>
            {
                console.log(err);
                interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TM2", "Error whilst accessing HLTV API using internal team id", botData)] });
            });
          }
          else
          {
            var mapArr = []
            var teamName, updated_at;
            for(var key in teamMapsResult)
            {
              teamMapsResult[key].dataValues.id = teamDictResult.team_id
              teamMapsResult[key].dataValues.name = teamMapsResult[key].team_name
              mapArr.push(teamMapsResult[key].dataValues);
              updated_at = teamMapsResult[key].dataValues.updated_at;
              teamName = teamMapsResult[key].dataValues.team_name;
            }

            //update the same as roster if cant actually update
            //I believe .id being present in the objects being passed is causing the error, maybe renamed the autoincrement id to field_id

            database.handleTeamDictUpdate(teamDictResult.team_id, teamName, new Date(teamDictResult.updated_at));
            //database.handleTeamMapsUpdate(mapArr, teamDictResult.team_id, teamName, new Date(updated_at));
            func.handleTeamMaps(interaction, mapArr, teamDictResult.team_id, teamName, botData)           //DBToHLTV needed
          }
        });
      }
    }).catch((err) =>
    {
      if (err)
          console.log(err)
      HLTV.getTeamByName({name: teamName}).then((res)=>
      {
          HLTV.getTeamStats({name: res.id}).then((res)=>
          {
              func.handleTeamMaps(interaction, conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name), res.id, res.name, botData);
          });

          database.authenticate(false);
      }).catch((err) =>
      {
          console.log(err);
          interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TM4", "Error whilst accessing HLTV API using provided team name", botData)] });
      });
    });
  }
}