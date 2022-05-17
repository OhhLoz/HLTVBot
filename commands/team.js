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

        var teamDictResult = await database.fetchTeamDict(teamName);    // NEED TO CHECK TEAMDICT FIRST SINCE WE DONT HAVE THE TEAMID
        //console.log(result);
        if (teamDictResult == undefined)    //if teamname not found in teamDictionary
        {
            HLTV.getTeamByName({name: teamName}).then((res)=>
            {
                //sanitize teamName to prevent sql injection

                database.insertTeamDict(res.id, res.name);
                if (teamName.toLowerCase() != res.name.toLowerCase())
                    database.insertTeamDict(res.id, teamName);

                database.handleTeamProfile(res);
                var embed = func.handleTeamProfile(res).then(interaction.editReply({ embeds: [embed] }));
            }).catch((err) =>
            {
                console.log(err);
                var embed = new MessageEmbed()
                .setTitle("Invalid Team")
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                .setDescription(`${teamName} is not a valid team name. Please try again or visit [hltv.org](${botData.hltvURL})`);
                interaction.editReply({ embeds: [embed] });
            });
        }
        else
        {
            //teamid found
            database.fetchTeamProfiles(teamDictResult.team_id).then((result) =>
            {
                if (result == undefined)
                {
                    // HLTV.getTeamByID (1 less API REquest).then(insertTeamProfiles & insertRoster)
                }

                // if result expired / updated too long ago update it
            });
        }
    }
}