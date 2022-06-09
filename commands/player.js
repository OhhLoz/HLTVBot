const { SlashCommandBuilder } = require("@discordjs/builders");
const databaseHandler = require("../databaseHandler.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("player")
		.setDescription("Lists statistics of a specified player")
        .addStringOption(option => option.setName('player').setDescription('Player to display statistics for').setRequired(true)),
	async execute(interaction, botData)
    {
        var playerName = interaction.options.getString('player');

        databaseHandler.handlePlayer(playerName, interaction, botData, false);
    }
}