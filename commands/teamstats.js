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
                    HLTV.getTeamStats({name: res.id}).then((res)=>
                    {
                        database.insertTeamStats(res);
                        func.handleTeamStats(interaction, res, botData);
                    });
                }).catch((err) =>
                {
                    console.log(err);
                    var embed = new MessageEmbed()
                    .setTitle("Invalid Team")
                    .setColor(0x00AE86)
                    .setTimestamp()
                    .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                    .setDescription(`Error whilst checking ${teamName} and/or accessing the database. Please try again or visit [hltv.org](${botData.hltvURL})`);
                    interaction.editReply({ embeds: [embed] });
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
                            var embed = new MessageEmbed()
                            .setTitle("Invalid Team")
                            .setColor(0x00AE86)
                            .setTimestamp()
                            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                            .setDescription(`Error whilst checking ${teamDictResult.team_id} and/or accessing the database. Please try again or visit [hltv.org](${botData.hltvURL})`);
                            interaction.editReply({ embeds: [embed] });
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
            }).catch((err) =>
            {
                console.log(err);
                var embed = new MessageEmbed()
                .setTitle("Invalid Team")
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                .setDescription(`Error whilst checking ${teamName} and/or accessing the database. Please try again or visit [hltv.org](${botData.hltvURL})`);
                interaction.editReply({ embeds: [embed] });
            });
        });
    }
}