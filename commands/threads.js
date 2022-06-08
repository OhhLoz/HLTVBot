const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("threads")
		.setDescription("Lists recent CS related hltv threads"),
	async execute(interaction, botData)
    {
      HLTV.getRecentThreads().then((res) =>
      {
        var embedcount = 0;
        var embed = new MessageEmbed()
        .setTitle("Recent Threads")
        .setColor(0xff8d00)
        .setURL(`${botData.hltvURL}/forums/counterstrike`)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG});
        for (index in res)
        {
          if(res[index].title != undefined && res[index].category == 'cs')
          {
            embed.addField(`${res[index].title}`, `[Link](${botData.hltvURL + res[index].link}) Replies: ${res[index].replies}`);
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
        var embed = new MessageEmbed()
        .setTitle("Error Occurred")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
        .setDescription(`An error occurred whilst fetching recent threads. Please try again or visit [hltv.org](${botData.hltvURL})`);
        interaction.editReply({ embeds: [embed] });
      });
    }
}