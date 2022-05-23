const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const database = require("../databaseWrapper.js")
const func = require("../functions.js")
const conv = require("../databaseConverters.js");
const databaseConstants = require("../databaseConstants.js")

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("team")
		.setDescription("Displays the profile related to the input team")
        .addStringOption(option => option.setName('teamname').setDescription('Team to display the profile for').setRequired(true)),
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
                    //var convertedDictRes = conv.teamDictHLTVtoDB(res);
                    var convertedRes = conv.teamProfilesHLTVtoDB(res);
                    database.insertTeamDict(res.id, res.name);
                    if (teamName.toLowerCase() != res.name.toLowerCase())
                        database.insertTeamDict(res.id, teamName);

                    database.checkUpdateTeamProfile(convertedRes);
                    func.handleTeamProfile(interaction, convertedRes, botData)
                }).catch((err) =>
                {
                    console.log(err);
                    interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:T1", "Error whilst accessing HLTV API using provided team name", botData)] });
                });
            }
            else
            {
                database.fetchTeamProfiles(teamDictResult.team_id).then((teamProfileResult) =>
                {
                    if (teamProfileResult == undefined)
                    {
                        HLTV.getTeam({id: teamDictResult.team_id}).then((res)=>
                        {
                            var convertedRes = conv.teamProfilesHLTVtoDB(res);

                            database.insertTeamProfile(convertedRes);
                            database.insertRoster(convertedRes.players, convertedRes.team_id);
                            func.handleTeamProfile(interaction, convertedRes, botData);
                        }).catch((err) =>
                        {
                            console.log(err);
                            interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:T2", "Error whilst accessing HLTV API using internal team id", botData)] });
                        });
                    }
                    else
                    {
                        //database.checkTeamDictUpdate(teamStatsResult.dataValues);
                        database.isExpired(new Date(teamProfileResult.dataValues.updated_at), databaseConstants.expiryTime.teamprofiles).then((needsUpdating) =>
                        {
                            if (needsUpdating)
                            {
                                HLTV.getTeam({id: teamDictResult.team_id}).then((res)=>
                                {
                                    var convertedRes = conv.teamProfilesHLTVtoDB(res);

                                    database.updateTeamProfile(convertedRes);
                                    database.updateRoster(convertedRes.players, convertedRes.team_id);
                                    func.handleTeamProfile(interaction, convertedRes, botData)
                                }).catch((err) =>
                                {
                                    console.log(err);
                                    interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:T3", "Error whilst accessing HLTV API using internal team id", botData)] });
                                });
                            }
                            else
                            {
                                database.fetchRoster(teamProfileResult.dataValues.team_id).then((fetchedRoster) =>
                                {
                                    var playersArr = []

                                    for(var key in fetchedRoster)
                                    {
                                        playersArr.push(fetchedRoster[key].dataValues);
                                    }

                                    teamProfileResult.dataValues.players = playersArr;
                                    func.handleTeamProfile(interaction, teamProfileResult.dataValues, botData)
                                })
                            }
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
                func.handleTeamProfile(interaction, res, botData).then(() => {
                    database.authenticate(false);
                })
            }).catch((err) =>
            {
                console.log(err);
                interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:T4", "Error whilst accessing HLTV API using provided team name", botData)] });
            });
        });
    }
}