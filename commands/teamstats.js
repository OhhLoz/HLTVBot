const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const teamDictionary = require("../teams.json");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("teamstats")
		.setDescription("Displays the statistics related to the input team")
        .addStringOption(option => option.setName('teamname').setDescription('Team to display the statistics for').setRequired(true)),
	async execute(interaction, client, botData)
    {
        var inputTeamName = interaction.options.getString('teamname');
        await interaction.deferReply();

        if(teamDictionary.hasOwnProperty(inputTeamName.toUpperCase()))
        {
            var teamName = inputTeamName.toUpperCase();
            var teamID = teamDictionary[teamName];

            HLTV.getTeamStats({id: teamID}).then(res =>
            {
                //console.log(res);
                const embed = new MessageEmbed()
                .setTitle(teamName + " Stats")
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                .setURL(`${botData.hltvURL}/stats/teams/${teamID}/${teamName}`)
                .addField("Maps Played", res.overview.mapsPlayed == undefined ? "Not Available" : res.overview.mapsPlayed.toString(), true)
                .addField("Wins", res.overview.wins == undefined ? "Not Available" : res.overview.wins.toString(), true)
                .addField("Losses", res.overview.losses == undefined ? "Not Available" : res.overview.losses.toString(), true)
                .addField("Kills", res.overview.totalKills == undefined ? "Not Available" : res.overview.totalKills.toString(), true)
                .addField("Deaths", res.overview.totalDeaths == undefined ? "Not Available" : res.overview.totalDeaths.toString(), true)
                .addField("KD Ratio", res.overview.kdRatio == undefined ? "Not Available" : res.overview.kdRatio.toString(), true)
                .addField("Average Kills Per Round", res.overview.totalKills == undefined || res.overview.roundsPlayed == undefined ? "Not Available" : (Math.round(res.overview.totalKills / res.overview.roundsPlayed * 100) / 100).toString(), true)
                .addField("Rounds Played", res.overview.roundsPlayed == undefined ? "Not Available" : res.overview.roundsPlayed.toString(), true)
                .addField("Overall Win%", res.overview.wins == undefined || res.overview.losses == undefined ? "Not Available" : (Math.round(res.overview.wins / (res.overview.losses + res.overview.wins) * 10000) / 100).toString() + "%", true)
                interaction.editReply({ embeds: [embed] });
            }).catch((err) =>
            {
                console.log(err);
                var embed = new MessageEmbed()
                .setTitle("Invalid Team")
                .setColor(0x00AE86)
                .setTimestamp()
                .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                .setDescription(`${teamName} is not a valid team. Please try again or visit [hltv.org](${botData.hltvURL})`);
                interaction.editReply({ embeds: [embed] });
            });
        }
        else
        {
            var embed = new MessageEmbed()
            .setTitle("Invalid Team")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`${teamName} is not a valid team. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        }
    }
}