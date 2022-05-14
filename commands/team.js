const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HLTV } = require('hltv');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("team")
		.setDescription("Displays the profile related to the input team")
        .addStringOption(option => option.setName('teamname').setDescription('Team to display the profile for').setRequired(true)),
	async execute(interaction, client, botData)
    {
        var teamName = interaction.options.getString('teamname');

        HLTV.getTeamByName({name: teamName}).then((res)=>
        {
            var playerRosterOutputStr = '';
            for (var i = 0; i < res.players.length; i++)
            {
                playerRosterOutputStr += `[${res.players[i].name}](${botData.hltvURL}/stats/players/${res.players[i].id}/${res.players[i].name})`
                if(i != res.players.length - 1)
                playerRosterOutputStr += ', ';
            }
            var embed = new MessageEmbed()
            .setTitle(teamName + " Profile")
            .setColor(0x00AE86)
            //.setThumbnail(res.logo)
            //.setImage(res.coverImage)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setURL(`${botData.hltvURL}/team/${res.id}/${teamName.replace(/\s+/g, '')}`)
            .addFields
            (
                {name: "Location", value: res.country.name == undefined ? "Not Available" : res.country.name},
                {name: "Facebook", value: res.facebook == undefined ? "Not Available" : res.facebook},
                {name: "Twitter", value: res.twitter == undefined ? "Not Available" : res.twitter},
                {name: "Instagram", value: res.instagram == undefined ? "Not Available" : res.instagram},
                {name: "Players", value: playerRosterOutputStr},
                {name: "Rank", value: res.rank.toString()}
            )
            interaction.editReply({ embeds: [embed] });
        }).catch((err) =>
        {
            console.log(err);
            var embed = new MessageEmbed()
            .setTitle("Invalid Team")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
            .setDescription(`${teamName} is not a valid team name. Please try again or visit [hltv.org](${botData.hltvURL})`);
            interaction.editReply({ embeds: [embed] });
        });
    }
}