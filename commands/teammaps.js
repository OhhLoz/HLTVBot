const { SlashCommandBuilder } = require("@discordjs/builders");
const { HLTV } = require('hltv');
const func = require("../functions.js")
const database = require("../databaseWrapper.js")
const conv = require("../databaseConverters.js")
const databaseConstants = require("../databaseConstants.js")

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
              var convertedStatsRes = conv.teamStatsHLTVtoDB(res);
              var convertedMapsRes = conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);
              func.handleTeamMaps(interaction, convertedMapsRes, res.id, res.name, botData);
              database.insertTeamMaps(convertedMapsRes);
              database.checkUpdateTeamStats(convertedStatsRes);
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
              var convertedStatsRes = conv.teamStatsHLTVtoDB(res);
              var convertedMapsRes = conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);
              func.handleTeamMaps(interaction, convertedMapsRes, res.id, res.name, botData);
              database.insertTeamMaps(convertedMapsRes);
              database.checkUpdateTeamStats(convertedStatsRes);
            }).catch((err) =>
            {
                console.log(err);
                interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TM2", "Error whilst accessing HLTV API using internal team id", botData)] });
            });
          }
          else
          {
            var mapArr = []
            for(var key in teamMapsResult)
            {
              mapArr.push(teamMapsResult[key].dataValues);
            }

            //database.checkTeamDictUpdate(teamMapsResult.dataValues);
            database.isExpired(new Date(mapArr[0].updated_at), databaseConstants.expiryTime.teammaps).then((needsUpdating) =>
            {
                if (needsUpdating)
                {
                    HLTV.getTeamStats({id: teamDictResult.team_id}).then((res)=>
                    {
                        var convertedStatsRes = conv.teamStatsHLTVtoDB(res);
                        var convertedRes = conv.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);
                        func.handleTeamMaps(interaction, convertedRes, res.id, res.name, botData);
                        database.updateTeamMaps(convertedRes, res.id, res.name);
                        database.checkUpdateTeamStats(convertedStatsRes);
                    }).catch((err) =>
                    {
                        console.log(err);
                        interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TM3", "Error whilst accessing HLTV API using internal team id", botData)] });
                    });
                }
                else
                    func.handleTeamMaps(interaction, mapArr, teamDictResult.team_id, mapArr[0].team_name, botData)
            });
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