const databaseConstants = require("./databaseConstants.js");
const database = require("./databaseWrapper.js");
const func = require("./functions.js");
const { HLTV } = require('hltv');

/**
 * Handles the database processing for the team profiles
 *
 * Checks for presence of team in teamdictionary database table, if not found queries HLTV API. The same occurs for the presence in teamprofiles table. Also updates the data if it is expired and contains a fallback to call hltv if any point fails.
 *
 * @param {string}   teamName            Team name to be queried
 * @param {Object}      response     Either a discord.js interaction object or a discord.js message object
 * @param {Object}   botData           Global bot data object
 */
var handleTeamProfile = (teamName, response, botData) =>
{
    database.fetchTeamDict(teamName).then(teamDictResult =>
    {
        if (teamDictResult == undefined)    //if teamid not found in teamDictionary
        {
            HLTV.getTeamByName({name: teamName}).then((res)=>
            {
                //var convertedDictRes = func.teamDictHLTVtoDB(res);
                var convertedRes = func.teamProfilesHLTVtoDB(res);
                var embed = func.formatTeamProfileEmbed(convertedRes, botData);
                response.editReply({ embeds: [embed] });

                database.insertTeamDict(res.id, res.name);
                if (teamName.toLowerCase() != res.name.toLowerCase())
                    database.insertTeamDict(res.id, teamName);

                database.checkUpdateTeamProfile(convertedRes);
            }).catch((err) =>
            {
                console.log(err);
                var errorMessage = "Error whilst accessing HLTV API using provided team name";
                if(err.message.includes(`Team ${teamName} not found`))
                    errorMessage = `"${teamName}" was not found using the HLTV API`

                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:T1", errorMessage, botData);
                response.editReply({ embeds: [embed] });
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
                        var convertedRes = func.teamProfilesHLTVtoDB(res);
                        var embed = func.formatTeamProfileEmbed(convertedRes, botData);
                        response.editReply({ embeds: [embed] });
                        database.insertTeamProfile(convertedRes);
                        database.insertRoster(convertedRes.players, convertedRes.team_id);
                    }).catch((err) =>
                    {
                        console.log(err);
                        var embed = func.formatErrorEmbed("HLTV API Error - Error Code:T2", "Error whilst accessing HLTV API using internal team id", botData);
                        response.editReply({ embeds: [embed] });
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
                                var convertedRes = func.teamProfilesHLTVtoDB(res);
                                var embed = func.formatTeamProfileEmbed(convertedRes, botData);
                                response.editReply({ embeds: [embed] });
                                database.updateTeamProfile(convertedRes);
                                database.updateRoster(convertedRes.players, convertedRes.team_id);
                            }).catch((err) =>
                            {
                                console.log(err);
                                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:T3", "Error whilst accessing HLTV API using internal team id", botData);
                                response.editReply({ embeds: [embed] });
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
                                var embed = func.formatTeamProfileEmbed(teamProfileResult.dataValues, botData);
                                response.editReply({ embeds: [embed] });
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
            func.formatTeamProfileEmbed(res, botData).then((result) => {
                response.editReply({ embeds: [result] });
                database.authenticate(false);
            })
        }).catch((err) =>
        {
            console.log(err);
            var embed = func.formatErrorEmbed("HLTV API Error - Error Code:T4", "Error whilst accessing HLTV API using provided team name", botData);
            response.editReply({ embeds: [embed] });
        });
    });
}

/**
 * Handles the database processing for the team stats
 *
 * Checks for presence of team in teamdictionary database table, if not found queries HLTV API. The same occurs for the presence in teamstats table. Also updates the data if it is expired and contains a fallback to call hltv if any point fails.
 *
 * @param {string}   teamName            Team name to be queried
 * @param {Object}      response     Either a discord.js interaction object or a discord.js message object
 * @param {Object}   botData           Global bot data object
 */
var handleTeamStats = (teamName, response, botData) =>
{
    database.fetchTeamDict(teamName).then(teamDictResult =>
    {
        if (teamDictResult == undefined)    //if teamid not found in teamDictionary
        {
            HLTV.getTeamByName({name: teamName}).then((res)=>
            {
                //var convertedRes = func.teamDictHLTVtoDB(res);
                var convertedRes = func.teamProfilesHLTVtoDB(res);
                database.insertTeamDict(res.id, res.name);
                if (teamName.toLowerCase() != res.name.toLowerCase())
                    database.insertTeamDict(res.id, teamName);

                database.checkUpdateTeamProfile(convertedRes);
                HLTV.getTeamStats({id: res.id}).then((res)=>
                {
                    var convertedStatsRes = func.teamStatsHLTVtoDB(res);
                    var convertedMapsRes = func.teamMapsHLTVtoDB(res);
                    var embed = func.formatTeamStatsEmbed(convertedStatsRes, botData);

                    response.editReply({ embeds: [embed] });
                    database.insertTeamStats(convertedRes);

                    database.checkUpdateTeamMaps(convertedMapsRes);
                });
            }).catch((err) =>
            {
                console.log(err);
                var errorMessage = "Error whilst accessing HLTV API using provided team name";
                if(err.message.includes(`Team ${teamName} not found`))
                    errorMessage = `"${teamName}" was not found using the HLTV API`

                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TS1", errorMessage, botData);
                response.editReply({ embeds: [embed] });
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
                        var convertedRes = func.teamStatsHLTVtoDB(res);
                        var convertedMapsRes = func.teamMapsHLTVtoDB(res);
                        var embed = func.formatTeamStatsEmbed(convertedRes, botData);

                        response.editReply({ embeds: [embed] });
                        database.insertTeamStats(convertedRes);

                        database.checkUpdateTeamMaps(convertedMapsRes);
                    }).catch((err) =>
                    {
                        console.log(err);
                        var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TS2", "Error whilst accessing HLTV API using internal team id", botData);
                        response.editReply({ embeds: [embed] });
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
                                var convertedRes = func.teamStatsHLTVtoDB(res);
                                var convertedMapsRes = func.teamMapsHLTVtoDB(res);
                                var embed = func.formatTeamStatsEmbed(convertedRes, botData);

                                response.editReply({ embeds: [embed] });
                                database.updateTeamStats(convertedRes);
                                database.checkUpdateTeamMaps(convertedMapsRes);
                            }).catch((err) =>
                            {
                                console.log(err);
                                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TS3", "Error whilst accessing HLTV API using internal team id", botData);
                                response.editReply({ embeds: [embed] });
                            });
                        }
                        else
                        {
                            var embed = func.formatTeamStatsEmbed(teamStatsResult.dataValues, botData);
                            response.editReply({ embeds: [embed] });
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
            HLTV.getTeamStats({name: res.id}).then((res)=>
            {
                var embed = func.formatTeamStatsEmbed(func.teamStatsHLTVtoDB(res), botData);
                response.editReply({ embeds: [embed] });
            });

            database.authenticate(false);
        }).catch((err) =>
        {
            console.log(err);
            var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TS4", "Error whilst accessing HLTV API using provided team name", botData);
            response.editReply({ embeds: [embed] });
        });
    });
}

/**
 * Handles the database processing for the team maps
 *
 * Checks for presence of team in teamdictionary database table, if not found queries HLTV API. The same occurs for the presence in teamprofiles table. Also updates the data (teamstats aswell since they share a common API call) if it is expired and contains a fallback to call hltv if any point fails.
 *
 * @param {string}   teamName            Team name to be queried
 * @param {Object}      response     Either a discord.js interaction object or a discord.js message object
 * @param {Object}   botData           Global bot data object
 */
 var handleTeamMaps = (teamName, response, botData) =>
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
                     func.handleTeamMaps(response, convertedMapsRes, res.id, res.name, botData);
                     database.insertTeamMaps(convertedMapsRes);
                     database.checkUpdateTeamStats(convertedStatsRes);
                 });
             }).catch((err) =>
             {
                 console.log(err);
                 var errorMessage = "Error whilst accessing HLTV API using provided team name";
                 if(err.message.includes(`Team ${teamName} not found`))
                     errorMessage = `"${teamName}" was not found using the HLTV API`

                 var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TM1", errorMessage, botData);
                 response.editReply({ embeds: [embed] });
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
                     func.handleTeamMaps(response, convertedMapsRes, res.id, res.name, botData);
                     database.insertTeamMaps(convertedMapsRes);
                     database.checkUpdateTeamStats(convertedStatsRes);
                 }).catch((err) =>
                 {
                     console.log(err);
                     var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TM2", "Error whilst accessing HLTV API using internal team id", botData);
                     response.editReply({ embeds: [embed] });
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
                             func.handleTeamMaps(response, convertedRes, res.id, res.name, botData);
                             database.updateTeamMaps(convertedRes, res.id, res.name);
                             database.checkUpdateTeamStats(convertedStatsRes);
                         }).catch((err) =>
                         {
                             console.log(err);
                             var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TM3", "Error whilst accessing HLTV API using internal team id", botData);
                             response.editReply({ embeds: [embed] });
                         });
                     }
                     else
                         func.handleTeamMaps(response, mapArr, teamDictResult.team_id, mapArr[0].team_name, botData)
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
 }

/**
 * Handles the database processing for the player
 *
 * Checks for presence of the player in the players database table, if not found queries HLTV API. Also updates the data if it is expired and contains a fallback to call hltv if any point fails.
 *
 * @param {string}   playerName            Player name to be queried
 * @param {Object}      response     Either a discord.js interaction object or a discord.js message object
 * @param {Object}   botData           Global bot data object
 */
var handlePlayer = (playerName, response, botData) =>
{
    database.fetchPlayer(playerName).then((playerResult) =>
        {
            if(playerResult == undefined)   //player not found in database
            {
                HLTV.getPlayerByName({name: playerName}).then((res)=>
                {
                    var convertedRes = func.playersHLTVtoDB(res);
                    var embed = func.formatPlayerEmbed(convertedRes, botData);
                    response.editReply({ embeds: [embed] });
                    database.insertPlayer(convertedRes);
                }).catch((err) =>
                {
                    console.log(err);
                    var errorMessage = "Error whilst accessing HLTV API using provided player name";
                    if(err.message.includes(`Player ${playerName} not found`))
                        errorMessage = `"${playerName}" was not found using the HLTV API`

                    var embed = func.formatErrorEmbed("HLTV API Error - Error Code:P1", errorMessage, botData);
                    response.editReply({ embeds: [embed] });
                });
            }
            else    //player found in database
            {
                database.isExpired(new Date(playerResult.dataValues.updated_at), databaseConstants.expiryTime.players).then((needsUpdating) =>
                {
                    if (needsUpdating)
                    {
                        HLTV.getPlayer({id: playerResult.id}).then((res)=>
                        {
                            var convertedRes = func.playersHLTVtoDB(res);
                            var embed = func.formatPlayerEmbed(convertedRes, botData);
                            response.editReply({ embeds: [embed] });
                            database.updatePlayer(convertedRes);
                        }).catch((err) =>
                        {
                            console.log(err);
                            var embed = func.formatErrorEmbed("HLTV API Error - Error Code:P2", "Error whilst accessing HLTV API using internal player id", botData);
                            response.editReply({ embeds: [embed] });
                        });
                    }
                    else
                    {
                        var embed = func.formatPlayerEmbed(playerResult.dataValues, botData);
                        response.editReply({ embeds: [embed] });
                    }
                });
            }
        }).catch((err) =>
        {
            if (err)
                console.log(err)
            HLTV.getPlayerByName({name: playerName}).then((res)=>
            {
                func.formatPlayerEmbed(res, botData).then((result) => {
                    response.editReply({ embeds: [result] });
                    database.authenticate(false);
                })
            }).catch((err) =>
            {
                console.log(err);
                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:P3", "Error whilst accessing HLTV API using provided player name", botData);
                response.editReply({ embeds: [embed] });
            });
        });
}

module.exports = {handleTeamProfile, handleTeamStats, handlePlayer, handleTeamMaps};