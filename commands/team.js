const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const database = require("../databaseWrapper.js")
const func = require("../functions.js")

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
                    func.handleTeamProfile(interaction, res, botData)
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
                            database.insertTeamProfile(res);
                            database.insertRoster(res.players, res.id);
                            func.handleTeamProfile(interaction, res, botData)
                        }).catch((err) =>
                        {
                            console.log(err);
                            interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:T2", "Error whilst accessing HLTV API using internal team id", botData)] });
                        });
                    }
                    else
                    {
                        database.fetchRoster(teamDictResult.team_id).then((fetchedRoster) =>
                        {
                            var resObj = teamProfileResult.dataValues;
                            resObj.id = resObj.team_id;
                            resObj.name = resObj.team_name;
                            resObj.country = {name: resObj.location};
                            var playersArr = []

                            for(var key in fetchedRoster)
                            {
                                playersArr.push(fetchedRoster[key].dataValues);
                            }

                            resObj.players = playersArr;

                            database.handleTeamDictUpdate(teamDictResult.team_id, resObj.name, new Date(teamDictResult.updated_at));
                            database.handleTeamProfileUpdate(resObj, new Date(teamProfileResult.dataValues.updated_at));

                            func.handleTeamProfile(interaction, resObj, botData)
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
                interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:T3", "Error whilst accessing HLTV API using provided team name", botData)] });
            });
        });
    }
}