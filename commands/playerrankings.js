const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("playerrankings")
		.setDescription("Displays the top 30 player rankings & recent position changes."),
	async execute(interaction, client, botData)
    {
        var outputStr = "";
        await interaction.deferReply();
        HLTV.getPlayerRanking({startDate: '', endDate: '', rankingFilter: 'Top30'}).then((res) =>
        {
            var count = 1;
            for (var playerObjKey in res)
            {
                var playerObj = res[playerObjKey];
                outputStr += `${count}. [${playerObj.player.name}](${botData.hltvURL}/stats/players/${playerObj.player.id}/${playerObj.player.name}) (${playerObj.rating1})\n`
                if (count == 30)
                break;
                count++;
            }
            var embed = new MessageEmbed()
            .setTitle("Player Rankings")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(outputStr);
            interaction.editReply({ embeds: [embed] });
        }).catch((err) =>
        {
            console.log(err);
            var embed = new MessageEmbed()
            .setTitle("Error Occurred")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`An error occurred whilst fetching player rankings. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        });
    }
}