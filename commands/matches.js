const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, CommandInteractionOptionResolver } = require('discord.js');
const { HLTV } = require('hltv');
const func = require("../functions.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("matches")
		.setDescription("Displays all known scheduled matches"),
	async execute(interaction, client, botData)
    {
        HLTV.getMatches().then((res) =>
        {
            var currIndex = 0;
            var embed = func.handlePages(res, currIndex, botData.COMMANDCODE.MATCHES);
            var originalMember = interaction.user;
            interaction.editReply({ embeds: [embed], ephemeral: false, components: [botData.interactionRow] });

            const filter = (user) =>
            {
                user.deferUpdate();
                return user.member.id === originalMember.id;
            }
            const collector = interaction.channel.createMessageComponentCollector({filter, componentType: 'BUTTON', time: 60000});

            collector.on('collect', (button) =>
            {
                try
                {
                    switch (button.customId)
                    {
                        case botData.reactionControls.PREV_PAGE:
                        {
                            if (currIndex - 3 >= 0)
                            currIndex-=3;
                            interaction.editReply({embeds: [func.handlePages(res, currIndex, botData.COMMANDCODE.MATCHES)]});
                            break;
                        }
                        case botData.reactionControls.NEXT_PAGE:
                        {
                            if (currIndex + 3 <= res.length - 1)
                            currIndex+=3;
                            interaction.editReply({embeds: [func.handlePages(res, currIndex, botData.COMMANDCODE.MATCHES)]});
                            break;
                        }
                        case botData.reactionControls.STOP:
                        {
                            // stop listening for reactions
                            collector.stop();
                            break;
                        }
                    }
                }
                catch(err)
                {
                    if (err)
                        console.log(err);

                    var embed = new MessageEmbed()
                    .setTitle("Error Occurred")
                    .setColor(0x00AE86)
                    .setTimestamp()
                    .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
                    .setDescription(`An error occurred during button interaction. Please try again or visit [hltv.org](${botData.hltvURL})`);
                    interaction.editReply({ embeds: [embed] });
                }
            });

            collector.on('end', async () =>
            {
                interaction.deleteReply().catch(err =>
                    {
                        if (err.code !== 10008)
                            console.log(err);
                    });
            });
        }).catch((err) =>
        {
          if (err)
            console.log(err);
          var embed = new MessageEmbed()
          .setTitle("Error Occurred")
          .setColor(0x00AE86)
          .setTimestamp()
          .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
          .setDescription(`An error occurred whilst fetching upcoming matches. Please try again or visit [hltv.org](${botData.hltvURL})`);
          interaction.editReply({ embeds: [embed] });
        });
    }
}