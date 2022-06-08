const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const func = require("../functions.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("Displays bot statistics, invite link and contact information"),
	async execute(interaction, botData)
    {
        var embed = new MessageEmbed()
        .setTitle("Bot Stats")
        .setColor(0xff8d00)
        .setTimestamp()
        .setThumbnail(botData.hltvIMG)
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
        .addFields
        (
            {name: "User Count", value: botData.usercount.toString(), inline:true},
            {name: "Bot User Count", value: botData.botcount.toString(), inline:true},
            {name: "Server Count", value: botData.servercount.toString(), inline:true},
            {name: "Channel Count", value: botData.channelcount.toString(), inline:true},
            {name: "Version", value: botData.version.toString(), inline:true},
            {name: "Uptime", value: func.getTime(client.uptime), inline:true},
            {name: "Invite Link", value: "[Invite](https://discordapp.com/oauth2/authorize?client_id=548165454158495745&scope=bot&permissions=277025442816)", inline:true},
            {name: "Support Link", value: "[GitHub](https://github.com/OhhLoz/HLTVBot)", inline:true},
            {name: "Support Server", value: "[Discord](https://discord.gg/wBW9B9TtYK)", inline:true},
            {name: "Bot Page", value: "[Vote Here!](https://top.gg/bot/548165454158495745)", inline:true},
            {name: "Donate", value: "[PayPal](https://www.paypal.me/LaurenceUre)", inline:true},
        )

        interaction.editReply
        ({
            embeds: [embed],
            ephemeral: false
        })
	}
}