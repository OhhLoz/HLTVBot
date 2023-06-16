const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require('discord.js');
const { HLTV } = require('hltv');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("threads")
		.setDescription("Lists recent CS related hltv threads"),
    async execute(interaction, client, botData)
    {
      HLTV.getRecentThreads().then((res) =>
      {
        var embedcount = 0;
        var embed = new EmbedBuilder()
        .setTitle("Recent Threads")
        .setColor(0xff8d00)
        .setURL(`${botData.hltvURL}/forums/counterstrike`)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG});
        for (index in res)
        {
          if(res[index].title != undefined && res[index].category == 'cs')
          {
            embed.addFields([{name: `${res[index].title}`, value: `[Link](${botData.hltvURL + res[index].link}) Replies: ${res[index].replies}`, inline: false}]);
            embedcount++;
          }
          if(embedcount >= 24)
            break;
        }
        if (embedcount == 0)
          embed.setDescription("No Threads found, please try again later.")

        interaction.editReply
        ({
          embeds: [embed],
          ephemeral: false
        })
      }).catch((err) =>
      {
        console.log(err);
        var embed = new EmbedBuilder()
        .setTitle("Error Occurred")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
        .setDescription(`An error occurred whilst fetching recent threads. Please try again or visit [hltv.org](${botData.hltvURL})`);
        interaction.editReply({ embeds: [embed] });
      });
    }
}