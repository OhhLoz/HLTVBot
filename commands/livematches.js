const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const func = require("../functions.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("livematches")
		.setDescription("Displays all currently live matches"),
	async execute(interaction, client, botData)
    {
        HLTV.getMatches().then((res) =>
        {
            var liveArr = [];

            for (var matchKey in res)
            {
                var match = res[matchKey];
                if (match.live == true)
                    liveArr.push(match);
            }

            var embed = new MessageEmbed()
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()});

            if (liveArr.length == 0)
            {
                embed.setTitle("There are currently no live matches.");
                interaction.editReply({ embeds: [embed], ephemeral: false});
            }
            else
            {
                var currIndex = 0;
                var embed = func.handlePages(liveArr, currIndex, botData.COMMANDCODE.LIVEMATCHES);
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
                                if (currIndex - 5 >= 0)
                                    currIndex-=5;
                                    interaction.editReply({embeds: [func.handlePages(liveArr, currIndex, botData.COMMANDCODE.LIVEMATCHES)]});
                                break;
                            }
                            case botData.reactionControls.NEXT_PAGE:
                            {
                                if (currIndex + 5 <= liveArr.length - 1)
                                    currIndex+=5;
                                    interaction.editReply({embeds: [func.handlePages(liveArr, currIndex, botData.COMMANDCODE.LIVEMATCHES)]});
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
                    interaction.deleteReply();
                });
            }
        }).catch((err) =>
        {
            if (err)
                console.log(err);
            var embed = new MessageEmbed()
            .setTitle("Error Occurred")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`An error occurred whilst fetching live matches. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        });
    }
}