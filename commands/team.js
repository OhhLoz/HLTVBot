const { SlashCommandBuilder } = require("@discordjs/builders");
const { HLTV } = require('hltv');
const database = require("../databaseWrapper.js")
const func = require("../functions.js")
const databaseConstants = require("../databaseConstants.js")
const databaseHandler = require("../databaseHandler.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("team")
		.setDescription("Displays the profile related to the input team")
        .addStringOption(option => option.setName('function').setDescription('What to display about the specified team').setRequired(true).addChoices({name:"profile", value:"profile"},
                                                                                                                                                      {name:"stats", value:"stats"},
                                                                                                                                                      {name:"maps", value:"maps"}))
        .addStringOption(option => option.setName('teamname').setDescription('Team to display the profile for').setRequired(true)),
	async execute(interaction, botData)
    {
        var category = interaction.options.getString("function");
        var teamName = interaction.options.getString('teamname');
        //sanitize teamName to prevent sql injection
        switch(category)
        {
            case ("profile"):
            {
                databaseHandler.handleTeamProfile(teamName, interaction, botData, false);
                break;
            }
            case ("stats"):
            {
                databaseHandler.handleTeamProfile(teamName, interaction, botData, false);
                break;
            }
            case "maps":
            {
                database.fetchTeamDict(teamName).then(teamDictResult =>
                {
                    if (teamDictResult == undefined)    //if teamid not found in teamDictionary
                    {
                        HLTV.getTeamByName({name: teamName}).then((res)=>
                        {
                            var convertedRes = func.teamProfilesHLTVtoDB(res);
                            database.insertTeamDict(res.id, res.name);
                            if (teamName.toLowerCase() != res.name.toLowerCase())
                                database.insertTeamDict(res.id, teamName);

                            database.checkUpdateTeamProfile(convertedRes);
                            HLTV.getTeamStats({id: res.id}).then((res)=>
                            {
                                var convertedStatsRes = func.teamStatsHLTVtoDB(res);
                                var convertedMapsRes = func.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);
                                func.handleTeamMaps(interaction, convertedMapsRes, res.id, res.name, botData);
                                database.insertTeamMaps(convertedMapsRes);
                                database.checkUpdateTeamStats(convertedStatsRes);
                            });
                        }).catch((err) =>
                        {
                            console.log(err);
                            var errorMessage = "Error whilst accessing HLTV API using provided team name";
                            if(err.message.includes(`Team ${teamName} not found`))
                                errorMessage = `"${teamName}" was not found using the HLTV API`

                            interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TM1", errorMessage, botData)] });
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
                            var convertedStatsRes = func.teamStatsHLTVtoDB(res);
                            var convertedMapsRes = func.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);
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
                                    var convertedStatsRes = func.teamStatsHLTVtoDB(res);
                                    var convertedRes = func.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);
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
                            func.handleTeamMaps(interaction, func.teamMapsHLTVtoDB(res.mapStats, res.id, res.name), res.id, res.name, botData);
                        });

                        database.authenticate(false);
                    }).catch((err) =>
                    {
                        console.log(err);
                        interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:TM4", "Error whilst accessing HLTV API using provided team name", botData)] });
                    });
                });
                break;
            }
        }
    }
}