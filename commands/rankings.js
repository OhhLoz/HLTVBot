const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');
const func = require("../functions.js")

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("rankings")
		.setDescription("Displays the top 30 rankings of teams or players")
        .addStringOption(option => option.setName("category").setDescription("Category of rankings to display").setRequired(true).addChoices({name:"team", value:"team"},
                                                                                                                                            {name:"player", value:"player"})),
	async execute(interaction, botData)
    {
        var category = interaction.options.getString("category");
        var embed = new MessageEmbed()
        .setColor(0xff8d00)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG});
        var outputStr = "";

        switch(category)
        {
            case "team":
            {
                HLTV.getTeamRanking().then((res) =>
                {
                    for (var rankObjKey in res)
                    {
                        var rankObj = res[rankObjKey];
                        var teamStr = `[${rankObj.team.name}](${botData.hltvURL}/team/${rankObj.team.id}/${rankObj.team.name.replace(/\s+/g, '')})`;
                        outputStr += `${rankObj.place}. ${teamStr} (${rankObj.change})\n`
                    }
                    embed.setTitle("Team Rankings");
                    embed.setURL(`${botData.hltvURL}/ranking/teams/`);
                    embed.setDescription(outputStr);

                    interaction.editReply
                    ({
                        embeds: [embed],
                        ephemeral: false
                    })
                }).catch((err) =>
                {
                    console.log(err);
                    interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:R1", "Error whilst accessing HLTV API", botData)] });
                });
                break;
            }
            case "player":
            {
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
                    embed.setTitle("Player Rankings");
                    embed.setURL(`${botData.hltvURL}/stats/players`);
                    embed.setDescription(outputStr);
                    interaction.editReply({ embeds: [embed] });
                }).catch((err) =>
                {
                    console.log(err);
                    interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:R2", "Error whilst accessing HLTV API", botData)] });
                });
                break;
            }
            default:
                interaction.editReply({ embeds: [func.formatErrorEmbed("Rankings Error - Error Code:R3", "Error whilst accessing HLTV API using provided team name", botData)] });
                break;
        }
    }
}