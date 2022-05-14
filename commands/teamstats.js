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
                .addFields
                (
                    {name: "Maps Played", value: res.overview.mapsPlayed == undefined ? "Not Available" : res.overview.mapsPlayed.toString(), inline: true},
                    {name: "Wins", value: res.overview.wins == undefined ? "Not Available" : res.overview.wins.toString(), inline: true},
                    {name: "Losses", value: res.overview.losses == undefined ? "Not Available" : res.overview.losses.toString(), inline: true},
                    {name: "Kills", value: res.overview.totalKills == undefined ? "Not Available" : res.overview.totalKills.toString(), inline: true},
                    {name: "Deaths", value: res.overview.totalDeaths == undefined ? "Not Available" : res.overview.totalDeaths.toString(), inline: true},
                    {name: "KD Ratio", value: res.overview.kdRatio == undefined ? "Not Available" : res.overview.kdRatio.toString(), inline: true},
                    {name: "Average Kills Per Round", value: res.overview.totalKills == undefined || res.overview.roundsPlayed == undefined ? "Not Available" : (Math.round(res.overview.totalKills / res.overview.roundsPlayed * 100) / 100).toString(), inline: true},
                    {name: "Rounds Played", value: res.overview.roundsPlayed == undefined ? "Not Available" : res.overview.roundsPlayed.toString(), inline: true},
                    {name: "Overall Win%", value: res.overview.wins == undefined || res.overview.losses == undefined ? "Not Available" : (Math.round(res.overview.wins / (res.overview.losses + res.overview.wins) * 10000) / 100).toString() + "%", inline: true},
                )
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