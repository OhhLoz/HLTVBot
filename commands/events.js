const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const func = require("../functions.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("events")
		.setDescription("Displays the currently running & upcoming CS:GO events"),
	async execute(interaction, client, botData)
    {
        await interaction.deferReply();
        HLTV.getEvents().then((res) =>
        {
            var currIndex = 0;
            var embed = func.handleEventPages(res, currIndex);
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
                switch (button.customId)
                {
                    case botData.reactionControls.PREV_PAGE:
                    {
                        if (currIndex - 3 >= 0)
                        currIndex-=3;
                        interaction.editReply({embeds: [func.handleEventPages(res, currIndex)]});
                        break;
                    }
                    case botData.reactionControls.NEXT_PAGE:
                    {
                        if (currIndex + 3 <= res.length - 1)
                        currIndex+=3;
                        interaction.editReply({embeds: [func.handleEventPages(res, currIndex)]});
                        break;
                    }
                    case botData.reactionControls.STOP:
                    {
                        // stop listening for reactions
                        collector.stop();
                        break;
                    }
                }
            });

            collector.on('end', async () => {
                interaction.deleteReply();
            });
        }).catch((err) =>
        {
            console.log(err);
            var embed = new MessageEmbed()
            .setTitle("Error Occurred")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`An error occurred whilst fetching events. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        });
    }
}