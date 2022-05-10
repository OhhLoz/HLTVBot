const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const teamDictionary = require("../teams.json");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("teamlist")
		.setDescription("Lists valid teams for the teammaps and teamstats commands"),
	async execute(interaction, client, botData)
    {
        var embed = new MessageEmbed()
        .setTitle("Valid Teams")
        .setColor(0xff8d00)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()});
        var outputStr = "";
        var count = 1;
        var teamKeysSorted = Object.keys(teamDictionary).sort();
        for (i = 0; i < teamKeysSorted.length; i++)
        {
        outputStr += teamKeysSorted[i];
        if(count != Object.keys(teamDictionary).length)
            outputStr += "\n";
        count++;
        }
        embed.setDescription(outputStr);

        interaction.editReply
        ({
            embeds: [embed],
            ephemeral: false
        })
	}
}