const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const func = require("../functions.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("news")
		.setDescription("Lists recent hltv news stories"),
    async execute(interaction, client, botData)
    {
        HLTV.getNews().then((res) =>
        {
            var currIndex = 0;
            var embed = func.handleNewsPages(res, currIndex);
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
                            if (currIndex - 8 >= 0)
                            currIndex-=8;
                            interaction.editReply({embeds: [func.handleNewsPages(res, currIndex)]});
                            break;
                        }
                        case botData.reactionControls.NEXT_PAGE:
                        {
                            if (currIndex + 8 <= res.length - 1)
                            currIndex+=8;
                            interaction.editReply({embeds: [func.handleNewsPages(res, currIndex)]});
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
                    .setURL(`${botData.hltvURL}`)
                    .setTimestamp()
                    .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
                    .setDescription(`An error occurred during button interaction. Please try again or visit [hltv.org](${botData.hltvURL})`);
                    interaction.editReply({ embeds: [embed] });
                }
            });

            // collector.on('end', async () =>
            // {
            //     interaction.deleteReply().catch(err =>
            //         {
            //             if (err.code !== 10008)
            //                 console.log(err);
            //         });
            // });
        }).catch((err) =>
        {
            if (err)
                console.log(err);
            var embed = new MessageEmbed()
            .setTitle("Error Occurred")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
            .setDescription(`An error occurred whilst fetching news. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        });
    }
}