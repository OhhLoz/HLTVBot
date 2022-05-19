const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageAttachment } = require('discord.js');
const { HLTV } = require('hltv');
const teamDictionary = require("../teams.json");
const func = require("../functions.js");
const nodeHtmlToImage = require('node-html-to-image')

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("teammaps")
		.setDescription("Displays the map statistics related to the input team")
    .addStringOption(option => option.setName('teamname').setDescription('Team to display the map statistics for').setRequired(true)),
	async execute(interaction, client, botData)
    {
        var inputTeamName = interaction.options.getString('teamname');

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

            var htmlString = func.handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr);

            nodeHtmlToImage({
              html: `${htmlString}`,
              quality: 100,
              type: 'png',
              transparent: true,
              puppeteerArgs: {
                args: ['--no-sandbox'],
              },
              encoding: 'buffer',
            }).then(imageResult =>
            {
              var image = new MessageAttachment(imageResult, `${currIndex}.png`)
              var embed = new MessageEmbed()
              .setColor(0x00AE86)
              .setTimestamp()
              .setTitle(teamName + " Maps")
              .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`);
              embed.setImage(`attachment://${currIndex}.png`);
              interaction.editReply({ embeds: [embed], ephemeral: false, components: [botData.interactionRow], files: [image] });

              var originalMember = interaction.user;

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
                        var embed = new MessageEmbed()
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .setTitle(teamName + " Maps")
                        .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`);
                        htmlString = func.handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr);
                        nodeHtmlToImage({
                          html: `${htmlString}`,
                          quality: 100,
                          type: 'png',
                          transparent: true,
                          puppeteerArgs: {
                            args: ['--no-sandbox'],
                          },
                          encoding: 'buffer',
                        }).then(imageResult =>
                        {
                          var image = new MessageAttachment(imageResult, `${currIndex}.png`)
                          embed.setImage(`attachment://${currIndex}.png`);
                          interaction.editReply({ embeds: [embed], ephemeral: false, components: [botData.interactionRow], files: [image] });
                        });
                      break;
                    }
                    case botData.reactionControls.NEXT_PAGE:
                    {
                      if (currIndex + 3 <= mapArr.length - 1)
                        currIndex+=3;
                        var embed = new MessageEmbed()
                        .setColor(0x00AE86)
                        .setTimestamp()
                        .setTitle(teamName + " Maps")
                        .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`);
                        htmlString = func.handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr);
                        nodeHtmlToImage({
                          html: `${htmlString}`,
                          quality: 100,
                          type: 'png',
                          transparent: true,
                          puppeteerArgs: {
                            args: ['--no-sandbox'],
                          },
                          encoding: 'buffer',
                        }).then(imageResult =>
                        {
                          var image = new MessageAttachment(imageResult, `${currIndex}.png`)
                          embed.setImage(`attachment://${currIndex}.png`);
                          interaction.editReply({ embeds: [embed], ephemeral: false, components: [botData.interactionRow], files: [image] });
                        });
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
            })
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
        }
        else
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