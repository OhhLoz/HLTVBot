const { SlashCommandBuilder } = require("@discordjs/builders");
const { HLTV } = require('hltv');
const database = require("../databaseWrapper.js")
const func = require("../functions.js")
const databaseConstants = require("../databaseConstants.js")

module.exports =
{
	data: new SlashCommandBuilder()
		.setName("player")
		.setDescription("Lists statistics of a specified player")
        .addStringOption(option => option.setName('player').setDescription('Player to display statistics for').setRequired(true)),
	async execute(interaction, botData)
    {
        var playerName = interaction.options.getString('player');

        database.fetchPlayer(playerName).then((playerResult) =>
        {
            if(playerResult == undefined)   //player not found in database
            {
                HLTV.getPlayerByName({name: playerName}).then((res)=>
                {
                    var convertedRes = func.playersHLTVtoDB(res);
                    var embed = func.formatPlayerEmbed(convertedRes, botData);
                    interaction.editReply({ embeds: [embed] });
                    database.insertPlayer(convertedRes);
                }).catch((err) =>
                {
                    console.log(err);
                    var errorMessage = "Error whilst accessing HLTV API using provided player name";
                    if(err.message.includes(`Player ${playerName} not found`))
                        errorMessage = `"${playerName}" was not found using the HLTV API`

                    interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:P1", errorMessage, botData)] });
                });
            }
            else    //player found in database
            {
                database.isExpired(new Date(playerResult.dataValues.updated_at), databaseConstants.expiryTime.players).then((needsUpdating) =>
                {
                    if (needsUpdating)
                    {
                        HLTV.getPlayer({id: playerResult.id}).then((res)=>
                        {
                            var convertedRes = func.playersHLTVtoDB(res);
                            var embed = func.formatPlayerEmbed(convertedRes, botData);
                            interaction.editReply({ embeds: [embed] });
                            database.updatePlayer(convertedRes);
                        }).catch((err) =>
                        {
                            console.log(err);
                            interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:P2", "Error whilst accessing HLTV API using internal player id", botData)] });
                        });
                    }
                    else
                        interaction.editReply({ embeds: [func.formatPlayerEmbed(playerResult.dataValues, botData)] });
                });
            }
        }).catch((err) =>
        {
            if (err)
                console.log(err)
            HLTV.getPlayerByName({name: playerName}).then((res)=>
            {
                func.formatPlayerEmbed(res, botData).then((result) => {
                    interaction.editReply({ embeds: [result] });
                    database.authenticate(false);
                })
            }).catch((err) =>
            {
                console.log(err);
                interaction.editReply({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:P3", "Error whilst accessing HLTV API using provided player name", botData)] });
            });
        });
    }
}