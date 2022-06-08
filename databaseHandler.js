const databaseConstants = require("./databaseConstants.js");
const database = require("./databaseWrapper.js");
const func = require("./functions.js");
const { HLTV } = require('hltv');

var handleTeamProfile = (teamName, response, botData, isLegacy) =>
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
                if(isLegacy)
                    response.channel.send({ embeds: [embed] });
                else
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
                if(isLegacy)
                    response.channel.send({ embeds: [embed] });
                else
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
                        if(isLegacy)
                            response.channel.send({ embeds: [embed] });
                        else
                            response.editReply({ embeds: [embed] });
                        database.insertTeamProfile(convertedRes);
                        database.insertRoster(convertedRes.players, convertedRes.team_id);
                    }).catch((err) =>
                    {
                        console.log(err);
                        var embed = func.formatErrorEmbed("HLTV API Error - Error Code:T2", "Error whilst accessing HLTV API using internal team id", botData);
                        if(isLegacy)
                            response.channel.send({ embeds: [embed] });
                        else
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
                                if(isLegacy)
                                    response.channel.send({ embeds: [embed] });
                                else
                                    response.editReply({ embeds: [embed] });
                                database.updateTeamProfile(convertedRes);
                                database.updateRoster(convertedRes.players, convertedRes.team_id);
                            }).catch((err) =>
                            {
                                console.log(err);
                                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:T3", "Error whilst accessing HLTV API using internal team id", botData);
                                if(isLegacy)
                                    response.channel.send({ embeds: [embed] });
                                else
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
                                if(isLegacy)
                                    response.channel.send({ embeds: [embed] });
                                else
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
                if(isLegacy)
                    response.channel.send({ embeds: [result] });
                else
                    response.editReply({ embeds: [result] });
                database.authenticate(false);
            })
        }).catch((err) =>
        {
            console.log(err);
            var embed = func.formatErrorEmbed("HLTV API Error - Error Code:T4", "Error whilst accessing HLTV API using provided team name", botData);
            if(isLegacy)
                response.channel.send({ embeds: [embed] });
            else
                response.editReply({ embeds: [embed] });
        });
    });
}

var handleTeamStats = (teamName, response, botData, isLegacy) =>
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

                    if(isLegacy)
                        response.channel.send({ embeds: [embed] });
                    else
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
                if(isLegacy)
                    response.channel.send({ embeds: [embed] });
                else
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

                        if(isLegacy)
                            response.channel.send({ embeds: [embed] });
                        else
                            response.editReply({ embeds: [embed] });
                        database.insertTeamStats(convertedRes);

                        database.checkUpdateTeamMaps(convertedMapsRes);
                    }).catch((err) =>
                    {
                        console.log(err);
                        var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TS2", "Error whilst accessing HLTV API using internal team id", botData);
                        if(isLegacy)
                            response.channel.send({ embeds: [embed] });
                        else
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

                                if(isLegacy)
                                    response.channel.send({ embeds: [embed] });
                                else
                                    response.editReply({ embeds: [embed] });
                                database.updateTeamStats(convertedRes);
                                database.checkUpdateTeamMaps(convertedMapsRes);
                            }).catch((err) =>
                            {
                                console.log(err);
                                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TS3", "Error whilst accessing HLTV API using internal team id", botData);
                                if(isLegacy)
                                    response.channel.send({ embeds: [embed] });
                                else
                                    response.editReply({ embeds: [embed] });
                            });
                        }
                        else
                        {
                            var embed = func.formatTeamStatsEmbed(teamStatsResult.dataValues, botData);
                            if(isLegacy)
                                response.channel.send({ embeds: [embed] });
                            else
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
                if(isLegacy)
                    response.channel.send({ embeds: [embed] });
                else
                    response.editReply({ embeds: [embed] });
            });

            database.authenticate(false);
        }).catch((err) =>
        {
            console.log(err);
            var embed = func.formatErrorEmbed("HLTV API Error - Error Code:TS4", "Error whilst accessing HLTV API using provided team name", botData);
            if(isLegacy)
                response.channel.send({ embeds: [embed] });
            else
                response.editReply({ embeds: [embed] });
        });
    });
}

var handlePlayer = (playerName, response, botData, isLegacy) =>
{
    database.fetchPlayer(playerName).then((playerResult) =>
        {
            if(playerResult == undefined)   //player not found in database
            {
                HLTV.getPlayerByName({name: playerName}).then((res)=>
                {
                    var convertedRes = func.playersHLTVtoDB(res);
                    var embed = func.formatPlayerEmbed(convertedRes, botData);
                    if(isLegacy)
                        response.channel.send({ embeds: [embed] });
                    else
                        response.editReply({ embeds: [embed] });
                    database.insertPlayer(convertedRes);
                }).catch((err) =>
                {
                    console.log(err);
                    var errorMessage = "Error whilst accessing HLTV API using provided player name";
                    if(err.message.includes(`Player ${playerName} not found`))
                        errorMessage = `"${playerName}" was not found using the HLTV API`

                    var embed = func.formatErrorEmbed("HLTV API Error - Error Code:P1", errorMessage, botData);
                    if(isLegacy)
                        response.channel.send({ embeds: [embed] });
                    else
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
                            if(isLegacy)
                                response.channel.send({ embeds: [embed] });
                            else
                                response.editReply({ embeds: [embed] });
                            database.updatePlayer(convertedRes);
                        }).catch((err) =>
                        {
                            console.log(err);
                            var embed = func.formatErrorEmbed("HLTV API Error - Error Code:P2", "Error whilst accessing HLTV API using internal player id", botData);
                            if(isLegacy)
                                response.channel.send({ embeds: [embed] });
                            else
                                response.editReply({ embeds: [embed] });
                        });
                    }
                    else
                    {
                        var embed = func.formatPlayerEmbed(playerResult.dataValues, botData);
                        if(isLegacy)
                            response.channel.send({ embeds: [embed] });
                        else
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
                    if(isLegacy)
                        response.channel.send({ embeds: [result] });
                    else
                        response.editReply({ embeds: [result] });
                    database.authenticate(false);
                })
            }).catch((err) =>
            {
                console.log(err);
                var embed = func.formatErrorEmbed("HLTV API Error - Error Code:P3", "Error whilst accessing HLTV API using provided player name", botData);
                if(isLegacy)
                    response.channel.send({ embeds: [embed] });
                else
                    response.editReply({ embeds: [embed] });
            });
        });
}

module.exports = {handleTeamProfile, handleTeamStats, handlePlayer};