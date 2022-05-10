const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const func = require("../functions.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("stats")
		.setDescription("Displays bot statistics, invite link and contact information"),
	async execute(interaction, client, botData)
    {
        var embed = new MessageEmbed()
        .setTitle("Bot Stats")
        .setColor(0xff8d00)
        .setTimestamp()
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
        .addField("User Count", botData.usercount.toString(), true)
        .addField("Bot User Count", botData.botcount.toString(), true)
        .addField("Server Count", botData.servercount.toString(), true)
        .addField("Channel Count", botData.channelcount.toString(), true)
        .addField("Version", botData.version.toString(), true)
        .addField("Uptime", func.getTime(client.uptime), true)
        .addField("Invite Link", "[Invite](https://discordapp.com/oauth2/authorize?client_id=548165454158495745&scope=bot&permissions=277025442816)", true)
        .addField("Support Link", "[GitHub](https://github.com/OhhLoz/HLTVBot)", true)
        .addField("Bot Page", "[Vote Here!](https://top.gg/bot/548165454158495745)", true)
        .addField("Donate", "[PayPal](https://www.paypal.me/LaurenceUre)", true)

        interaction.editReply
        ({
            embeds: [embed],
            ephemeral: false
        })
	}
}