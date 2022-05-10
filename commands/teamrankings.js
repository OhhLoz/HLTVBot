const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("teamrankings")
		.setDescription("Displays the top 30 team rankings & recent position changes"),
	async execute(interaction, client, botData)
    {
        var embed = new MessageEmbed()
        .setTitle("Valid Teams")
        .setColor(0xff8d00)
        .setURL(`${botData.hltvURL}/ranking/teams/`)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()});
        var outputStr = "";
        HLTV.getTeamRanking().then((res) =>
        {
            for (var rankObjKey in res)
            {
                var rankObj = res[rankObjKey];
                var teamStr = `[${rankObj.team.name}](${botData.hltvURL}/team/${rankObj.team.id}/${rankObj.team.name.replace(/\s+/g, '')})`;
                outputStr += `${rankObj.place}. ${teamStr} (${rankObj.change})\n`
            }
            embed.setDescription(outputStr);

            interaction.editReply
            ({
                embeds: [embed],
                ephemeral: false
            })
        }).catch((err) =>
        {
            console.log(err);
            var embed = new MessageEmbed()
            .setTitle("Error Occurred")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`An error occurred whilst fetching team rankings. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        });
    }
}