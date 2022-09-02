const { SlashCommandBuilder } = require("@discordjs/builders");
const databaseHandler = require("../databaseHandler.js");

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("team")
		.setDescription("Displays the profile related to the input team")
        .addStringOption(option => option.setName('function').setDescription('What to display about the specified team').setRequired(true).addChoices({name:"profile", value:"profile"},
                                                                                                                                                      {name:"stats", value:"stats"},
                                                                                                                                                      {name:"maps", value:"maps"}))
        .addStringOption(option => option.setName('teamname').setDescription('Team to display the profile for').setRequired(true)),
    async execute(interaction, client, botData)
    {
        var category = interaction.options.getString("function");
        var teamName = interaction.options.getString('teamname');

        switch(category)
        {
            case ("profile"):
            {
                databaseHandler.handleTeamProfile(teamName, interaction, botData);
                break;
            }
            case ("stats"):
            {
                databaseHandler.handleTeamStats(teamName, interaction, botData);
                break;
            }
            case "maps":
            {
                databaseHandler.handleTeamMaps(teamName, interaction, botData);
                break;
            }
        }
    }
}