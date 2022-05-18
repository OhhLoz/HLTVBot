const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const database = require("../databaseWrapper.js")
const databaseConstants = require("../databaseConstants.js")
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

        var teamDictResult = await database.fetchTeamDict(teamName);    // NEED TO CHECK TEAMDICT FIRST SINCE WE DONT HAVE THE TEAMID

        if (teamDictResult == undefined)    //if teamid not found in teamDictionary
        {
            HLTV.getTeamByName({name: teamName}).then((res)=>
            {
                //sanitize teamName to prevent sql injection

                database.insertTeamDict(res.id, res.name);
                if (teamName.toLowerCase() != res.name.toLowerCase())
                    database.insertTeamDict(res.id, teamName);

                database.handleTeamProfile(res);
                var embed = func.handleTeamProfile(res, botData)
                interaction.editReply({ embeds: [embed] });
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
            //teamid found in teamDict
            database.fetchTeamProfiles(teamDictResult[0].team_id).then((result) =>
            {
                if (result == undefined)
                {
                    // if no team profile
                    HLTV.getTeam({id: teamDictResult[0].team_id}).then((res)=>
                    {
                        database.handleTeamProfile(res);
                        var embed = func.handleTeamProfile(res, botData)
                        interaction.editReply({ embeds: [embed] });
                    }).catch((err) =>
                    {
                        console.log(err);
                        var embed = new MessageEmbed()
                        .setTitle("Invalid Team")
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                        .setDescription(`Error whilst checking ${teamDictResult[0].team_id} and/or accessing the database. Please try again or visit [hltv.org](${botData.hltvURL})`);
                        interaction.editReply({ embeds: [embed] });
                    });
                }
                else
                {
                    var playersArr = []
                    var resObj = result[0].dataValues;
                    resObj.id = resObj.team_id;
                    resObj.name = resObj.team_name;
                    resObj.country = {name: resObj.location};

                    database.fetchRoster(resObj.id).then((fetchedRoster) =>
                    {
                        for(var key in fetchedRoster)
                        {
                            playersArr.push(fetchedRoster[key].dataValues);
                        }

                        resObj.players = playersArr;

                        // if result expired / updated too long ago update it
                        var dbDate = new Date(result[0].dataValues.updated_at);
                        var dateMilliDifference = Date.now() - dbDate.getTime();
                        //console.log(func.getTime(dateMilliDifference));
                        if (dateMilliDifference > databaseConstants.expiryTime.teamprofiles)
                        {
                            database.updateRoster(resObj.players, resObj.id);
                            database.updateTeamProfile(resObj);
                        }

                        var embed = func.handleTeamProfile(resObj, botData)
                        interaction.editReply({ embeds: [embed] });
                    });
                }
            });
        }
    }
}