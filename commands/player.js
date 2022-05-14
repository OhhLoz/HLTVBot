const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("player")
		.setDescription("Lists statistics of a specified player")
        .addStringOption(option => option.setName('player').setDescription('Player to display statistics for').setRequired(true)),
	async execute(interaction, client, botData)
    {
        var playerName = interaction.options.getString('player');
        HLTV.getPlayerByName({name: playerName}).then((res)=>
        {
            var embed = new MessageEmbed()
            .setTitle(playerName + " Player Profile")
            .setColor(0x00AE86)
            .setThumbnail(res.image)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setURL(`${botData.hltvURL}/player/${res.id}/${res.ign}/`)
            .addFields
            (
                {name: "Name", value: res.name == undefined ? "Not Available" : res.name},
                {name: "IGN", value:  res.ign == undefined ? "Not Available" : res.ign},
                {name: "Age", value:  res.age == undefined ? "Not Available" : res.age.toString()},
                {name: "Country", value:  res.country.name == undefined ? "Not Available" : res.country.name},
                {name: "Facebook", value:  res.facebook == undefined ? "Not Available" : res.facebook},
                {name: "Twitch", value:  res.twitch == undefined ? "Not Available" : res.twitch},
                {name: "Twitter", value:  res.twitter == undefined ? "Not Available" : res.twitter},
                {name: "Team", value:  `[${res.team.name}](${botData.hltvURL}/team/${res.team.id}/${res.team.name.replace(/\s+/g, '')})`},
                {name: "Rating", value:  res.statistics.rating == undefined ? "Not Available" : res.statistics.rating.toString()},
            )
            interaction.editReply({ embeds: [embed] });
        }).catch((err) =>
        {
            console.log(err);
            var embed = new MessageEmbed()
            .setTitle("Invalid Player")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`${playerName} is not a valid playername. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        });
    }
}