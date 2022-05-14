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
        .addFields
        (
            {name: "\u200b", value: `${botData.titleSpacer}**Bot Commands**`},
            {name: "/help", value: "Lists all current commands"},
            {name: "/ping", value: "Displays the current ping to the bot & the Discord API"},
            {name: "/stats", value: "Displays bot statistics, invite link and contact information"},
            {name: "\u200b", value: `${botData.titleSpacer}**Team Commands**`},
            {name: "/teamlist", value: "Lists all of the currently accepted teams for the teamstats & teammaps commands"},
            {name: "/teamrankings", value: "Displays the top 30 team rankings & recent position changes"},
            {name: "/team [teamname]", value: "Displays the profile related to the input team"},
            {name: "/teamstats [teamname]", value: "Displays the statistics related to the input team"},
            {name: "/teammaps [teamname]", value: "Displays the map statistics related to the input team"},
            {name: "\u200b", value: `${botData.titleSpacer}**Player Commands**`},
            {name: "/player [player]", value: "Displays player statistics from the given player"},
            {name: "/playerrankings", value: "Displays the top 30 player rankings & recent position changes."},
            {name: "\u200b", value: `${botData.titleSpacer}**Match Commands**`},
            {name: "/livematches", value: "Displays all currently live matches"},
            {name: "/matches", value: "Displays all known scheduled matches"},
            {name: "/results", value: "Displays match results from the last 7 days"},
            {name: "/events", value: "Displays info on current & upcoming events"},
            {name: "\u200b", value: `${botData.titleSpacer}**Info Commands**`},
            {name: "/threads", value: "Displays the most recent hltv user threads"},
            {name: "/news", value: "Displays the most recent hltv news & match info"}
        )

        interaction.editReply
        ({
            embeds: [embed],
            ephemeral: true
        })
	}
}