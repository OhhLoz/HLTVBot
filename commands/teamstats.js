const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const func = require("../functions.js")
const database = require("../databaseWrapper.js")
const databaseConstants = require("../databaseConstants.js")
const conv = require("../databaseConverters.js")

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("teamstats")
		.setDescription("Displays the statistics related to the input team")
        .addStringOption(option => option.setName('teamname').setDescription('Team to display the statistics for').setRequired(true)),
	async execute(interaction, client, botData)
    {
        var teamName = interaction.options.getString('teamname');
        //sanitize teamName to prevent sql injection

        database.fetchTeamDict(teamName).then(teamDictResult =>
        {
            if (teamDictResult == undefined)    //if teamid not found in teamDictionary
            {
                HLTV.getTeamByName({name: teamName}).then((res)=>
                {
                    //var convertedRes = conv.teamDictHLTVtoDB(res);
                    database.insertTeamDict(res.id, res.name);
                    if (teamName.toLowerCase() != res.name.toLowerCase())
                        database.insertTeamDict(res.id, teamName);

                    database.checkUpdateTeamProfile(res);
                    HLTV.getTeamStats({id: res.id}).then((res)=>
                    {
                        var convertedStatsRes = conv.teamStatsHLTVtoDB(res);
                        var convertedMapsRes = conv.teamMapsHLTVtoDB(res);
                        database.insertTeamStats(convertedRes);
                        func.handleTeamStats(interaction, convertedStatsRes, botData);

                        database.checkUpdateTeamMaps(convertedMapsRes);
                    });
                }).catch((err) =>
                {
                    console.log(err);
                    interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TS1", "Error whilst accessing HLTV API using provided team name", botData)] });
                });
            }
            else
            {
                database.fetchTeamStats(teamDictResult.team_id).then((teamStatsResult) =>
                {
                    if (teamStatsResult == undefined)
                    {
                        HLTV.getTeamStats({id: teamDictResult.team_id}).then((res)=>
                        {
                            var convertedRes = conv.teamStatsHLTVtoDB(res);
                            var convertedMapsRes = conv.teamMapsHLTVtoDB(res);
                            database.insertTeamStats(convertedRes);
                            func.handleTeamStats(interaction, convertedRes, botData)

                            database.checkUpdateTeamMaps(convertedMapsRes);
                        }).catch((err) =>
                        {
                            console.log(err);
                            interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TS2", "Error whilst accessing HLTV API using internal team id", botData)] });
                        });
                    }
                    else
                    {
                        //database.checkTeamDictUpdate(teamStatsResult.dataValues);
                        database.isExpired(new Date(teamStatsResult.dataValues.updated_at), databaseConstants.expiryTime.teamstats).then((needsUpdating) =>
                        {
                            if (needsUpdating)
                            {
                                HLTV.getTeamStats({id: teamDictResult.team_id}).then((res)=>
                                {
                                    var convertedRes = conv.teamStatsHLTVtoDB(res);
                                    var convertedMapsRes = conv.teamMapsHLTVtoDB(res);
                                    database.updateTeamStats(convertedRes);
                                    database.checkUpdateTeamMaps(convertedMapsRes);
                                    func.handleTeamStats(interaction, convertedRes, botData)
                                }).catch((err) =>
                                {
                                    console.log(err);
                                    interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TS3", "Error whilst accessing HLTV API using internal team id", botData)] });
                                });
                            }
                            else
                                func.handleTeamStats(interaction, teamStatsResult.dataValues, botData)
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
                    func.handleTeamStats(interaction, conv.teamStatsHLTVtoDB(res), botData);
                });

                database.authenticate(false);
            }).catch((err) =>
            {
                console.log(err);
                interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TS4", "Error whilst accessing HLTV API using provided team name", botData)] });
            });
        });
    }
}