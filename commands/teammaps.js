const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const teamDictionary = require("../teams.json");
const func = require("../functions.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("teammaps")
		.setDescription("Displays the map statistics related to the input team")
    .addStringOption(option => option.setName('teamname').setDescription('Team to display the map statistics for').setRequired(true)),
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
            var currIndex = 0;
            var mapArr = [];
            var mapNameArr = [];
            var mapcount = 0;

            for (var mapKey in res.mapStats)
            {
              var map = res.mapStats[mapKey];
              mapArr[mapcount] = map;
              mapNameArr[mapcount] = mapKey;
              mapcount++;
            }

            var embed = func.handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr);

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
                    interaction.editReply({embeds: [func.handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr)]});
                  break;
                }
                case botData.reactionControls.NEXT_PAGE:
                {
                  if (currIndex + 3 <= mapArr.length - 1)
                    currIndex+=3;
                    interaction.editReply({embeds: [func.handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr)]});
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
            .setTitle("Invalid Team")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`${teamName} is not a valid team or another error occurred. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
          });
        }else
        {
          var embed = new MessageEmbed()
          .setTitle("Invalid Team")
          .setColor(0x00AE86)
          .setTimestamp()
          .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
          .setDescription(`${teamName} is not a valid team or another error occurred. Please try again or visit [hltv.org](${botData.hltvURL})`);
          interaction.editReply({ embeds: [embed] });
        }
    }
}