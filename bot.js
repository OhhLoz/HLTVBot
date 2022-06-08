//    LIBRARIES & FUNCTIONS
const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const { HLTV } = require('hltv');
const func = require("./functions.js");
const fs = require("fs");
const database = require("./databaseWrapper.js");
const databaseConstants = require("./databaseConstants.js");

//   SET TRUE WHEN TESTING TO DISABLE TOPGG Posting & TO USE TEST BOT TOKEN
process.env.TESTING = true;

//    DATA IMPORT
const package = require("./package.json");
const COMMANDCODE = require("./commandcodes.json");

//    URLS & TEXT FORMATTING
const hltvURL = "https://www.hltv.org";
const topggVoteURL = "https://top.gg/bot/548165454158495745/vote";
var titleSpacer = "\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800";

//    GLOBAL VARIABLES
const reactionControls =
{
  PREV_PAGE: '⬅',
  NEXT_PAGE: '➡',
  STOP: '⏹',
}

const row = new Discord.MessageActionRow()
.addComponents(
  new Discord.MessageButton()
  .setStyle('LINK')
  .setLabel("Vote!")
  .setURL(topggVoteURL),
  new Discord.MessageButton()
  .setCustomId(reactionControls.PREV_PAGE)
  .setStyle('SECONDARY')
  .setLabel(" ")
  .setEmoji(reactionControls.PREV_PAGE),
  new Discord.MessageButton()
  .setCustomId(reactionControls.STOP)
  .setStyle('SECONDARY')
  .setLabel(" ")
  .setEmoji(reactionControls.STOP),
  new Discord.MessageButton()
  .setCustomId(reactionControls.NEXT_PAGE)
  .setStyle('SECONDARY')
  .setLabel(" ")
  .setEmoji(reactionControls.NEXT_PAGE),
  new Discord.MessageButton()
  .setStyle('LINK')
  .setLabel("HLTV")
  .setURL(hltvURL)
);

var botData =
{
  servercount: 0,
  usercount: 0,
  botcount: 0,
  channelcount: 0,
  version: package.version,
  hltvURL: hltvURL,
  titleSpacer: titleSpacer,
  interactionRow: row,
  reactionControls: reactionControls,
  COMMANDCODE: COMMANDCODE,
  hltvIMG: ""
}

if(!process.env.TESTING)
{
  const { AutoPoster } = require('topgg-autoposter');
  const ap = AutoPoster(process.env.TOPGG_TOKEN, client);

  ap.on('posted', (stats) =>
  {
    console.log(`Posted stats to Top.gg | ${stats.serverCount} servers`)
  })
}
else
{
  const testConfig = require('./config.json');
  process.env.prefix = testConfig.prefix;
  process.env.BOT_TOKEN = testConfig.token;
  process.env.DATABASE_URL = testConfig.databaseURL;
}

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

const commandsArr = [];

client.commands = new Discord.Collection();

for (const file of commandFiles)
{
	const command = require(`./commands/${file}`);
	commandsArr.push(command.data.toJSON());
	client.commands.set(command.data.name, command);
}

console.log(`Loaded ${commandsArr.length} commands`);

client.on("ready", () =>
{
  //  STATISTICS GATHERING
  client.guilds.cache.forEach((guild) =>
  {
    if (guild.id == "264445053596991498") //top.gg discord guildId, ignored since it isn't "real" users for statistics
      return;
    botData = func.checkStats(guild, botData, true);
  })

  database.authenticate(true);
  botData.hltvIMG = client.user.displayAvatarURL();

  const guild = client.guilds.cache.get('509391645226172420'); //development server guildid

  if(process.env.TESTING)
    guild.commands.set(commandsArr);
  else
    client.application.commands.set(commandsArr);

  console.log(`HLTVBot is currently serving ${botData.usercount} users, in ${botData.channelcount} channels of ${botData.servercount} servers. Alongside ${botData.botcount} bot brothers.`);
  client.user.setActivity(`${botData.servercount} servers | /help | .hltv`, { type: 'WATCHING' });
});

client.on("guildCreate", guild =>
{
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  botData = func.checkStats(guild, botData, true);
  client.user.setActivity(`${botData.servercount} servers | /help | .hltv`, { type: 'WATCHING' });
});

client.on("guildDelete", guild =>
{
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id}). This guild had ${guild.memberCount} members!`);
  botData = func.checkStats(guild, botData, false);
  client.user.setActivity(`${botData.servercount} servers | /help | .hltv`, { type: 'WATCHING' });
});

client.on("interactionCreate", async (interaction) =>
{
  if (!interaction.isCommand())
    return;

  const command = client.commands.get(interaction.commandName);

  if (!command)
    return;

  try
  {
    await interaction.deferReply();
    await command.execute(interaction, botData);
  }
  catch(err)
  {
    console.log("\n\nEntered root command error state\n\n");
    if (err)
      console.log(err);

    var embed = new Discord.MessageEmbed()
    .setTitle("Error Occurred")
    .setColor(0x00AE86)
    .setTimestamp()
    .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
    .setDescription(`An error occurred whilst executing slash command.\nPlease try again or visit [hltv.org](${hltvURL})\nIf this persists please re-add the bot to the server to refresh bot permissions.`);
    if(interaction.deferred)
      await interaction.editReply({ embeds: [embed] });
    else
      await interaction.reply({ embeds: [embed] });
  }
})


/*






                    LEGACY COMMANDS BELOW, WILL BE REMOVED ONCE MESSAGE CONTENT INTENT IS REVOKED (CURRENTLY DUE 1ST SEPTEMBER 2022)







*/

client.on("messageCreate", async message =>
{
  // Ignore other bots.
  if(message.author.bot) return;

  // Ignore any message that does not start with our prefix
  if(message.content.indexOf(process.env.prefix) !== 0) return;

  // Separate our command names, and command arguments
  const args = message.content.slice(process.env.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  switch(command)
  {
    case "threads":
    {
      HLTV.getRecentThreads().then((res) =>
      {
        var embedcount = 0;
        var embed = new Discord.MessageEmbed()
        .setTitle("Recent Threads")
        .setColor(0xff8d00)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG});
        for (index in res)
        {
          if(res[index].title != undefined && res[index].category == 'cs')
          {
            embed.addField(`${res[index].title}`, `[Link](${hltvURL + res[index].link}) Replies: ${res[index].replies} Category: ${res[index].category}`);
            embedcount++;
          }
          if(embedcount >= 24)
            break;
        }
        if (embedcount == 0)
          embed.setDescription("No Threads found, please try again later.")
        message.channel.send({ embeds: [embed] });
      })
      break;
    }
    case "news":
    {
      HLTV.getNews().then((res) =>
      {
        var currIndex = 0;
        var embed = func.handleNewsPages(res, currIndex);
        var originalAuthor = message.author;
        message.channel.send({ embeds: [embed] }).then((message) =>
        {
          message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));

          const filter = (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id);
          const collector = message.createReactionCollector({filter, time: 60000});

          collector.on('collect', (reaction, user) =>
          {
            switch (reaction.emoji.name)
            {
              case reactionControls.PREV_PAGE:
              {
                if (currIndex - 8 >= 0)
                  currIndex-=8;
                message.edit({embeds: [func.handleNewsPages(res, currIndex)]});
                break;
              }
              case reactionControls.NEXT_PAGE:
              {
                if (currIndex + 8 <= res.length - 1)
                  currIndex+=8;
                message.edit({embeds: [func.handleNewsPages(res, currIndex)]});
                break;
              }
              case reactionControls.STOP:
              {
                // stop listening for reactions
                collector.stop();
                break;
              }
            }
          });

          collector.on('end', async () => {
              message.delete().catch(err =>
              {
                  if (err.code !== 10008)
                      console.log(err);
              });
          });
        });
      });
      break;
    }
    case "rankings":
    {
      var embed = new Discord.MessageEmbed()
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG});
      var outputStr = "";
      if(args[0] == "team")
      {
        HLTV.getTeamRanking().then((res) => {
          for (var rankObjKey in res)
          {
            var rankObj = res[rankObjKey];
            var teamStr = `[${rankObj.team.name}](https://www.hltv.org/team/${rankObj.team.id}/${rankObj.team.name.replace(/\s+/g, '')})`;
            outputStr += `${rankObj.place}. ${teamStr} (${rankObj.change})\n`
          }
          embed
          .setTitle("Team Rankings")
          .setDescription(outputStr);
          message.channel.send({ embeds: [embed] });
        });
      }
      else if(args[0] == "player")
      {
        HLTV.getPlayerRanking({startDate: '', endDate: '', rankingFilter: 'Top30'}).then((res) => {
          var count = 1;
          for (var playerObjKey in res)
          {
            var playerObj = res[playerObjKey];
            outputStr += `${count}. [${playerObj.player.name}](https://www.hltv.org/stats/players/${playerObj.player.id}/${playerObj.player.name}) (${playerObj.rating1})\n`
            if (count == 30)
              break;
            count++;
          }
          embed
          .setTitle("Player Rankings")
          .setDescription(outputStr);
          message.channel.send({ embeds: [embed] });
        });
      }
      else
        message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LR", "Incorrect command format, Please use .hltv for correct format.", botData)] });
      break;
    }
    case "player":
    {
      var outputStr = "";
      database.fetchPlayer(args[0]).then((playerResult) =>
      {
        if(playerResult == undefined)   //player not found in database
        {
          HLTV.getPlayerByName({name: args[0]}).then((res)=>
          {
              var convertedRes = func.playersHLTVtoDB(res);
              var embed = func.formatPlayerEmbed(convertedRes, botData);
              message.channel.send({ embeds: [embed] });
              database.insertPlayer(convertedRes);
          }).catch((err) =>
          {
              console.log(err);
              var errorMessage = "Error whilst accessing HLTV API using provided player name";
              if(err.message.includes(`Player ${args[0]} not found`))
                  errorMessage = `"${args[0]}" was not found using the HLTV API`

              message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LP1", errorMessage, botData)] });
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
                    message.channel.send({ embeds: [embed] });
                    database.updatePlayer(convertedRes);
                }).catch((err) =>
                {
                    console.log(err);
                    message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LP2", "Error whilst accessing HLTV API using internal player id", botData)] });
                });
            }
            else
              message.channel.send({ embeds: [func.formatPlayerEmbed(playerResult.dataValues, botData)] });
          });
        }
      }).catch((err) =>
      {
          if (err)
              console.log(err)
          HLTV.getPlayerByName({name: args[0]}).then((res)=>
          {
            func.formatPlayerEmbed(res, botData).then((result) => {
              message.channel.send({ embeds: [result] });
              database.authenticate(false);
            })
          }).catch((err) =>
          {
            console.log(err);
            message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LP3", "Error whilst accessing HLTV API using provided player name", botData)] });
          });
      });
      break;
    }
    case "hltv":
    {
      if (args.length == 0)
      {
        var embed = new Discord.MessageEmbed()
        .setTitle("Help")
        .setColor(0xff8d00)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
        .addFields
        (
            {name: "\u200b", value: `${titleSpacer}**Bot Commands**`},
            {name: ".hltv", value: "Lists all current commands"},
            {name: ".hltv ping", value: "Displays the current ping to the bot & the Discord API"},
            {name: ".hltv stats", value: "Displays bot statistics, invite link and contact information"},
            {name: "\u200b", value: `${titleSpacer}**Team Commands**`},
            {name: ".team profile [teamname]", value: "Displays the profile related to the input team"},
            {name: ".team stats [teamname]", value: "Displays the statistics related to the input team"},
            {name: ".team maps [teamname]", value: "Displays the map statistics related to the input team"},
            {name: "\u200b", value: `${titleSpacer}**Player Commands**`},
            {name: ".player [player]", value: "Displays player statistics from the given player"},
            {name: "\u200b", value: `${titleSpacer}**Rankings Commands**`},
            {name: ".rankings player", value: "Displays the top 30 player rankings."},
            {name: ".rankings team", value: "Displays the top 30 team rankings."},
            {name: "\u200b", value: `${titleSpacer}**Match Commands**`},
            {name: ".livematches", value: "Displays all currently live matches"},
            {name: ".matches", value: "Displays all known scheduled matches"},
            {name: ".results", value: "Displays match results from the last 7 days"},
            {name: ".events", value: "Displays info on current & upcoming events"},
            {name: "\u200b", value: `${titleSpacer}**Info Commands**`},
            {name: ".threads", value: "Displays the most recent hltv user threads"},
            {name: ".news", value: "Displays the most recent hltv news & match info"}
        )

        message.channel.send({ embeds: [embed] });
      }
      else if (args[0] == "ping")
      {
        // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
        // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
        const m = await message.channel.send("Calculating");
        m.edit(`Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
      }
      else if (args[0] == "stats")
      {
        var embed = new Discord.MessageEmbed()
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
        message.channel.send({ embeds: [embed] });
      }
      else
        message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LH", "Incorrect command format, Please use .hltv for correct format.", botData)] });
      break;
    }
    case "team":
    {
      // IF JUST TEAMNAME display a team overview
      if(args[0] == "profile")
      {
        database.fetchTeamDict(args[1]).then(teamDictResult =>
        {
            if (teamDictResult == undefined)    //if teamid not found in teamDictionary
            {
                HLTV.getTeamByName({name: args[1]}).then((res)=>
                {
                    //var convertedDictRes = func.teamDictHLTVtoDB(res);
                    var convertedRes = func.teamProfilesHLTVtoDB(res);
                    var embed = func.formatTeamProfileEmbed(convertedRes, botData)
                    message.channel.send({ embeds: [embed] });
                    database.insertTeamDict(res.id, res.name);
                    if (args[1].toLowerCase() != res.name.toLowerCase())
                        database.insertTeamDict(res.id, args[1]);

                    database.checkUpdateTeamProfile(convertedRes);
                }).catch((err) =>
                {
                    console.log(err);
                    var errorMessage = "Error whilst accessing HLTV API using provided team name";
                    if(err.message.includes(`Team ${args[1]} not found`))
                        errorMessage = `"${args[1]}" was not found using the HLTV API`

                    message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LT1", errorMessage, botData)] });
                });
            }
            else
            {
              database.fetchTeamProfiles(teamDictResult.team_id).then((teamProfileResult) =>
              {
                  if (teamProfileResult == undefined)
                  {
                      HLTV.getTeam({id: teamDictResult.team_id}).then((res)=>
                      {
                          var convertedRes = func.teamProfilesHLTVtoDB(res);
                          var embed = func.formatTeamProfileEmbed(convertedRes, botData)
                          message.channel.send({ embeds: [embed] });
                          database.insertTeamProfile(convertedRes);
                          database.insertRoster(convertedRes.players, convertedRes.team_id);
                      }).catch((err) =>
                      {
                          console.log(err);
                          message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LT2", "Error whilst accessing HLTV API using internal team id", botData)] });
                      });
                  }
                  else
                  {
                      //database.checkTeamDictUpdate(teamStatsResult.dataValues);
                      database.isExpired(new Date(teamProfileResult.dataValues.updated_at), databaseConstants.expiryTime.teamprofiles).then((needsUpdating) =>
                      {
                        if (needsUpdating)
                        {
                            HLTV.getTeam({id: teamDictResult.team_id}).then((res)=>
                            {
                                var convertedRes = func.teamProfilesHLTVtoDB(res);
                                var embed = func.formatTeamProfileEmbed(convertedRes, botData)
                                message.channel.send({ embeds: [embed] });
                                database.updateTeamProfile(convertedRes);
                                database.updateRoster(convertedRes.players, convertedRes.team_id);
                            }).catch((err) =>
                            {
                                console.log(err);
                                message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LT3", "Error whilst accessing HLTV API using internal team id", botData)] });
                            });
                        }
                        else
                        {
                            database.fetchRoster(teamProfileResult.dataValues.team_id).then((fetchedRoster) =>
                            {
                                var playersArr = []

                                for(var key in fetchedRoster)
                                {
                                    playersArr.push(fetchedRoster[key].dataValues);
                                }

                                teamProfileResult.dataValues.players = playersArr;
                                var embed = func.formatTeamProfileEmbed(teamProfileResult.dataValues, botData)
                                message.channel.send({ embeds: [embed] });
                            })
                        }
                    });
                  }
                });
            }
          }).catch((err) =>
          {
              if (err)
                  console.log(err)
              HLTV.getTeamByName({name: args[1]}).then((res)=>
              {
                  func.formatTeamProfileEmbed(interaction, res, botData).then(() => {
                      database.authenticate(false);
                  })
              }).catch((err) =>
              {
                  console.log(err);
                  message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LT4", "Error whilst accessing HLTV API using provided team name", botData)] });
              });
          });
      }
      else if (args[0] == "stats")     // If stats after teamname display a team stats page
      {
        database.fetchTeamDict(args[1]).then(teamDictResult =>
          {
            if (teamDictResult == undefined)    //if teamid not found in teamDictionary
            {
                HLTV.getTeamByName({name: args[1]}).then((res)=>
                {
                    //var convertedRes = func.teamDictHLTVtoDB(res);
                    var convertedRes = func.teamProfilesHLTVtoDB(res);
                    database.insertTeamDict(res.id, res.name);
                    if (args[1].toLowerCase() != res.name.toLowerCase())
                        database.insertTeamDict(res.id, args[1]);

                    database.checkUpdateTeamProfile(convertedRes);
                    HLTV.getTeamStats({id: res.id}).then((res)=>
                    {
                        var convertedStatsRes = func.teamStatsHLTVtoDB(res);
                        var convertedMapsRes = func.teamMapsHLTVtoDB(res);
                        var embed = func.formatTeamStatsEmbed(convertedStatsRes, botData);
                        message.channel.send({ embeds: [embed] });
                        database.insertTeamStats(convertedRes);

                        database.checkUpdateTeamMaps(convertedMapsRes);
                    });
                }).catch((err) =>
                {
                    console.log(err);
                    var errorMessage = "Error whilst accessing HLTV API using provided team name";
                    if(err.message.includes(`Team ${args[1]} not found`))
                        errorMessage = `"${args[1]}" was not found using the HLTV API`

                    message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LTS1", errorMessage, botData)] });
                });
              }
              else
              {
                  database.fetchTeamStats(teamDictResult.team_id).then((teamStatsResult) =>
                  {
                      if (teamStatsResult == undefined)
                      {
                          HLTV.getTeamStats({id: teamDictResult.team_id}).then((res)=>
                          {
                              var convertedRes = func.teamStatsHLTVtoDB(res);
                              var convertedMapsRes = func.teamMapsHLTVtoDB(res);
                              var embed = func.formatTeamStatsEmbed(convertedRes, botData);
                              message.channel.send({ embeds: [embed] });
                              database.insertTeamStats(convertedRes);

                              database.checkUpdateTeamMaps(convertedMapsRes);
                          }).catch((err) =>
                          {
                              console.log(err);
                              message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LTS2", "Error whilst accessing HLTV API using internal team id", botData)] });
                          });
                      }
                      else
                      {
                          //database.checkTeamDictUpdate(teamStatsResult.dataValues);
                          database.isExpired(new Date(teamStatsResult.dataValues.updated_at), databaseConstants.expiryTime.teamstats).then((needsUpdating) =>
                          {
                              if (needsUpdating)
                              {
                                  HLTV.getTeamStats({id: teamDictResult.team_id}).then((res)=>
                                  {
                                      var convertedRes = func.teamStatsHLTVtoDB(res);
                                      var convertedMapsRes = func.teamMapsHLTVtoDB(res);
                                      var embed = func.formatTeamStatsEmbed(convertedRes, botData);
                                      message.channel.send({ embeds: [embed] });
                                      database.updateTeamStats(convertedRes);
                                      database.checkUpdateTeamMaps(convertedMapsRes);
                                  }).catch((err) =>
                                  {
                                      console.log(err);
                                      message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LTS3", "Error whilst accessing HLTV API using internal team id", botData)] });
                                  });
                              }
                              else
                                  message.channel.send({ embeds: [func.formatTeamStatsEmbed(teamStatsResult.dataValues, botData)] });
                          });
                      }
                  });
              }
          }).catch((err) =>
          {
              if (err)
                  console.log(err)
              HLTV.getTeamByName({name: args[1]}).then((res)=>
              {
                  HLTV.getTeamStats({name: res.id}).then((res)=>
                  {
                      var embed = func.formatTeamStatsEmbed(func.teamStatsHLTVtoDB(res), botData);
                      message.channel.send({ embeds: [embed] });
                  });

                  database.authenticate(false);
              }).catch((err) =>
              {
                  console.log(err);
                  message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LTS4", "Error whilst accessing HLTV API using provided team name", botData)] });
              });
          });
      }
      else if (args[0] == "maps")     // If maps after teamname display a team maps page
      {
        HLTV.getTeamStats({id: teamID}).then(res =>
          {
            var currIndex = 0;
            var mapArr = func.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);

            var embed = func.handleMapPages(currIndex, teamName, teamID, mapArr);
            var originalAuthor = message.author;
            message.channel.send({ embeds: [embed] }).then((message) =>
            {
              message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));

              const filter = (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id);
              const collector = message.createReactionCollector({filter, time: 60000});

              collector.on('collect', (reaction) =>
              {
                switch (reaction.emoji.name)
                {
                  case reactionControls.PREV_PAGE:
                  {
                    if (currIndex - 3 >= 0)
                      currIndex-=3;
                    message.edit({embeds: [func.handleMapPages(currIndex, teamName, teamID, mapArr)]});
                    break;
                  }
                  case reactionControls.NEXT_PAGE:
                  {
                    if (currIndex + 3 <= mapArr.length - 1)
                      currIndex+=3;
                    message.edit({embeds: [func.handleMapPages(currIndex, teamName, teamID, mapArr)]});
                    break;
                  }
                  case reactionControls.STOP:
                  {
                    // stop listening for reactions
                    collector.stop();
                    break;
                  }
                }
              });

              collector.on('end', async () => {
                  message.delete().catch(err =>
                  {
                      if (err.code !== 10008)
                          console.log(err);
                  });
              });
            });
          });
      }
      else  // Error catching for incorrect command
        message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LT", "Incorrect command format, Please use .hltv for correct format.", botData)] });
      break;
    }
    case "results":
    {
      var currDate = new Date();
      var prevDate = new Date();
      prevDate.setDate(currDate.getDate() - 7); // last 7 days

      //console.log("currDate: " + currDate.toISOString().substring(0, 10) + ", prevDate: " + prevDate.toISOString().substring(0, 10));
      HLTV.getResults({startDate: prevDate.toISOString().substring(0, 10), endDate: currDate.toISOString().substring(0, 10)}).then((res) =>
      {
        var currIndex = 0;
        var embed = func.handlePages(res, currIndex, COMMANDCODE.RESULTS);
        var originalAuthor = message.author;
        message.channel.send({ embeds: [embed] }).then((message) =>
        {
          message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));

          const filter = (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id);
          const collector = message.createReactionCollector({filter, time: 60000});

          collector.on('collect', (reaction) =>
          {
            switch (reaction.emoji.name)
            {
              case reactionControls.PREV_PAGE:
              {
                if (currIndex - 3 >= 0)
                  currIndex-=3;
                message.edit({embeds: [func.handlePages(res, currIndex, COMMANDCODE.RESULTS)]});
                break;
              }
              case reactionControls.NEXT_PAGE:
              {
                if (currIndex + 3 <= res.length)
                  currIndex+=3;
                message.edit({embeds: [func.handlePages(res, currIndex, COMMANDCODE.RESULTS)]});
                break;
              }
              case reactionControls.STOP:
              {
                // stop listening for reactions
                collector.stop();
                break;
              }
            }
          });

          collector.on('end', async () => {
              message.delete().catch(err =>
              {
                  if (err.code !== 10008)
                      console.log(err);
              });
          });
        });
      });
      break;
    }
    case "matches":
    {
      HLTV.getMatches().then((res) =>
      {
        var currIndex = 0;
        var embed = func.handlePages(res, currIndex, COMMANDCODE.MATCHES);
        var originalAuthor = message.author;
        message.channel.send({ embeds: [embed] }).then((message) =>
        {
          message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));
          const filter = (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id);
          const collector = message.createReactionCollector({filter, time: 60000});

          collector.on('collect', (reaction) =>
          {
            switch (reaction.emoji.name)
            {
              case reactionControls.PREV_PAGE:
              {
                if (currIndex - 3 >= 0)
                  currIndex-=3;
                message.edit({embeds: [func.handlePages(res, currIndex, COMMANDCODE.MATCHES)]});
                break;
              }
              case reactionControls.NEXT_PAGE:
              {
                if (currIndex + 3 <= res.length)
                  currIndex+=3;
                message.edit({embeds: [func.handlePages(res, currIndex, COMMANDCODE.MATCHES)]});
                break;
              }
              case reactionControls.STOP:
              {
                // stop listening for reactions
                //message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                collector.stop();
                break;
              }
            }
          });

          collector.on('end', async () => {
              message.delete().catch(err =>
              {
                  if (err.code !== 10008)
                      console.log(err);
              });
          });
        });
      });
      break;
    }
    case "livematches":
    {
      HLTV.getMatches().then((res) =>
      {
        var liveArr = [];
        var livecount = 0;

        for (var matchKey in res)
        {
          var match = res[matchKey];
          if (match.live == true)
          {
            liveArr[livecount] = match;
            livecount++;
          }
        }

        var embed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG});

        if (livecount == 0)
        {
          embed.setTitle("There are currently no live matches.");
          message.channel.send({ embeds: [embed] });
        }
        else
        {
          var currIndex = 0;
          embed = func.handlePages(liveArr, currIndex, COMMANDCODE.LIVEMATCHES);
          var originalAuthor = message.author;
          message.channel.send({ embeds: [embed] }).then((message) =>
          {
            message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));
            const filter = (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id);
            const collector = message.createReactionCollector({filter, time: 60000});

            collector.on('collect', (reaction, user) =>
            {
              switch (reaction.emoji.name)
              {
                case reactionControls.PREV_PAGE:
                {
                  if (currIndex - 5 >= 0)
                    currIndex-=5;
                  message.edit({embeds: [func.handlePages(liveArr, currIndex, COMMANDCODE.LIVEMATCHES)]});
                  break;
                }
                case reactionControls.NEXT_PAGE:
                {
                  if (currIndex + 5 <= liveArr.length)
                    currIndex+=5;
                  message.edit({embeds: [func.handlePages(liveArr, currIndex, COMMANDCODE.LIVEMATCHES)]});
                  break;
                }
                case reactionControls.STOP:
                {
                  // stop listening for reactions
                  collector.stop();
                  break;
                }
              }
            });

            collector.on('end', async () => {
                message.delete().catch(err =>
                {
                    if (err.code !== 10008)
                        console.log(err);
                });
            });
          });
        }
      });
      break;
    }
    case "events":
    {
      HLTV.getEvents().then((res) =>
      {
        var currIndex = 0;
        var embed = func.handleEventPages(res, currIndex);
        var originalAuthor = message.author;

        message.channel.send({ embeds: [embed]}).then((message) =>
        {
          message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));
          const filter = (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id);
          const collector = message.createReactionCollector({filter, time: 60000});

          collector.on('collect', (reaction, user) =>
          {
            switch (reaction.emoji.name)
            {
              case reactionControls.PREV_PAGE:
              {
                if (currIndex - 3 >= 0)
                  currIndex-=3;
                message.edit({embeds: [func.handleEventPages(res, currIndex)]});
                break;
              }
              case reactionControls.NEXT_PAGE:
              {
                if (currIndex + 3 <= res.length)
                  currIndex+=3;
                message.edit({embeds: [func.handleEventPages(res, currIndex)]});
                break;
              }
              case reactionControls.STOP:
              {
                // stop listening for reactions
                collector.stop();
                break;
              }
            }
          });

          collector.on('end', async () => {
              message.delete().catch(err =>
              {
                  if (err.code !== 10008)
                      console.log(err);
              });
          });
        })
      });
      break;
    }
    default:
    {
      message.channel.send({ embeds: [func.formatErrorEmbed("HLTV API Error - Error Code:LC", "Error whilst reading command, please try again or consult .hltv for a list of accepted commands.", botData)] });
      break;
    }
  }
});

client.login(process.env.BOT_TOKEN);