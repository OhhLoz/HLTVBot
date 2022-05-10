const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Lists all bot commands"),
	async execute(interaction, client, botData)
    {
        var embed = new MessageEmbed()
        .setTitle("Help")
        .setColor(0xff8d00)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
        .addField('\u200b', `${botData.titleSpacer}**Bot Commands**`)
        .addField("/help", "Lists all current commands", false)
        .addField("/ping", "Displays the current ping to the bot & the API", false)
        .addField("/stats", "Displays bot statistics, invite link and contact information", false)
        .addField('\u200b', `${botData.titleSpacer}**Team Commands**`)
        .addField("/teamlist", "Lists all of the currently accepted teams for the teamstats & teammaps commands", false)
        .addField("/teamrankings", "Displays the top 30 team rankings & recent position changes", false)
        .addField("/team [teamname]", "Displays the profile related to the input team", false)
        .addField("/teamstats [teamname]", "Displays the statistics related to the input team", false)
        .addField("/teammaps [teamname]", "Displays the map statistics related to the input team", false)
        .addField('\u200b', `${botData.titleSpacer}**Player Commands**`)
        .addField("/player [player]", "Displays player statistics from the given player", false)
        .addField("/playerrankings", "Displays the top 30 player rankings & recent position changes.",false)
        .addField('\u200b', `${botData.titleSpacer}**Match Commands**`)
        .addField("/livematches", "Displays all currently live matches", false)
        .addField("/matches", "Displays all known scheduled matches", false)
        .addField("/results", "Displays match results from the last 7 days", false)
        .addField("/events", "Displays info on current & upcoming events", false)
        .addField('\u200b', `${botData.titleSpacer}**Info Commands**`)
        .addField("/threads", "Displays the most recent hltv user threads", false)
        .addField("/news", "Displays the most recent hltv news & match info", false)

        interaction.editReply
        ({
            embeds: [embed],
            ephemeral: true
        })
	}
}