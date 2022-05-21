const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const func = require("../functions.js")
const database = require("../databaseWrapper.js")

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
                    database.insertTeamDict(res.id, res.name);
                    if (teamName.toLowerCase() != res.name.toLowerCase())
                        database.insertTeamDict(res.id, teamName);

                    database.fetchTeamProfiles(res.id).then((teamProfileResult) =>
                    {
                        if (teamProfileResult == undefined)
                        {
                            database.insertTeamProfile(res);
                            database.insertRoster(res.players, res.id);
                        }
                        else
                            database.handleTeamProfileUpdate(res, new Date(result.updated_at))
                    });
                    HLTV.getTeamStats({id: res.id}).then((res)=>
                    {
                        database.insertTeamStats(res);
                        func.handleTeamStats(interaction, res, botData);
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
                            database.insertTeamStats(res);
                            func.handleTeamStats(interaction, res, botData)
                        }).catch((err) =>
                        {
                            console.log(err);
                            interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TS2", "Error whilst accessing HLTV API using internal team id", botData)] });
                        });
                    }
                    else
                    {
                        var resObj = teamStatsResult.dataValues;
                        resObj.id = resObj.team_id;
                        resObj.name = resObj.team_name;
                        resObj.overview = {};
                        resObj.overview.wins = resObj.wins;
                        resObj.overview.losses = resObj.losses;
                        resObj.overview.totalKills = resObj.kills;
                        resObj.overview.totalDeaths = resObj.deaths;
                        resObj.overview.kdRatio = resObj.kdRatio;
                        resObj.overview.roundsPlayed = resObj.roundsPlayed;
                        resObj.overview.mapsPlayed = resObj.mapsPlayed;

                        database.handleTeamDictUpdate(teamDictResult.team_id, resObj.name, new Date(teamDictResult.updated_at));
                        database.handleTeamStatsUpdate(resObj, new Date(teamStatsResult.dataValues.updated_at));
                        func.handleTeamStats(interaction, resObj, botData)
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
                    func.handleTeamStats(interaction, res, botData);
                });

                database.authenticate(false);
            }).catch((err) =>
            {
                console.log(err);
                interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TS3", "Error whilst accessing HLTV API using provided team name", botData)] });
            });
        });
    }
}