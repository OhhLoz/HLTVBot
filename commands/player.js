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
        await interaction.deferReply();
        HLTV.getPlayerByName({name: playerName}).then((res)=>
        {
            var embed = new MessageEmbed()
            .setTitle(playerName + " Player Profile")
            .setColor(0x00AE86)
            .setThumbnail(res.image)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setURL(`https://www.hltv.org/player/${res.id}/${res.ign}/`)
            .addField("Name", res.name == undefined ? "Not Available" : res.name)
            .addField("IGN", res.ign == undefined ? "Not Available" : res.ign)
            .addField("Age", res.age == undefined ? "Not Available" : res.age.toString())
            .addField("Country", res.country.name == undefined ? "Not Available" : res.country.name)
            .addField("Facebook", res.facebook == undefined ? "Not Available" : res.facebook)
            .addField("Twitch", res.twitch == undefined ? "Not Available" : res.twitch)
            .addField("Twitter", res.twitter == undefined ? "Not Available" : res.twitter)
            .addField("Team", `[${res.team.name}](https://www.hltv.org/team/${res.team.id}/${res.team.name.replace(/\s+/g, '')})`)
            .addField("Rating", res.statistics.rating == undefined ? "Not Available" : res.statistics.rating.toString());
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