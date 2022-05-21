//    LIBRARIES & FUNCTIONS
const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const { HLTV } = require('hltv');
const func = require("./functions.js");
const fs = require("fs");
const database = require("./databaseWrapper.js");

//   SET TRUE WHEN TESTING TO DISABLE TOPGG Posting & TO USE TEST BOT TOKEN
const TESTING = true;

//    DATA IMPORT
const teamDictionary = require("./teams.json");
const alternateTeamDictionary = require("./alternateteams.json");
const package = require("./package.json");
const COMMANDCODE = require("./commandcodes.json");

//    URLS & TEXT FORMATTING
const hltvURL = "https://www.hltv.org";
const topggVoteURL = "https://top.gg/bot/548165454158495745/vote";
var titleSpacer = "\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800";

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
  COMMANDCODE: COMMANDCODE
}

if(!TESTING)
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

  const guild = client.guilds.cache.get('509391645226172420'); //development server guildid

  if(TESTING)
    guild.commands.set(commandsArr);
  else
    client.application.commands.set(commandsArr);

  console.log(`HLTVBot is currently serving ${botData.usercount} users, in ${botData.channelcount} channels of ${botData.servercount} servers. Alongside ${botData.botcount} bot brothers.`);
  client.user.setActivity(`${botData.servercount} servers | /help | .hltv`, { type: 'WATCHING' });
  reverseTeamDictionary = func.reverseMapFromMap(teamDictionary);
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
    await command.execute(interaction, client, botData);
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
    .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
    .setDescription(`An error occurred whilst executing slash command. If this persists please add the bot to the server again to refresh bot permissions. Please try again or visit [hltv.org](${hltvURL})`);
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

  if(command == "threads")
  {
    HLTV.getRecentThreads().then((res) =>
    {
      var embedcount = 0;
      var embed = new Discord.MessageEmbed()
      .setTitle("Recent Threads")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()});
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
  }
  else if (command == "news")
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
  }
  else if (command == "teams")
  {
    var embed = new Discord.MessageEmbed();
    var outputStr = "";
    if(args.length == 0) // if user has just entered .teams as opposed to .teams ranking
    {
      embed
      .setTitle("Valid Teams")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
      var count = 1;
      var teamKeysSorted = Object.keys(teamDictionary).sort();
      for (i = 0; i < teamKeysSorted.length; i++)
      {
        outputStr += teamKeysSorted[i];
        if(count != Object.keys(teamDictionary).length)
          outputStr += "\n";
        count++;
      }
      embed.setDescription(outputStr);
      message.channel.send({ embeds: [embed] });
    }
    else if(args[0] == "rankings" || args[0] == "ranking") // if user has entered ".teams rankings"
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
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
        .setDescription(outputStr);
        message.channel.send({ embeds: [embed] });
      });
    }
    else
    {
      embed
      .setTitle("Command Error")
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
      .setDescription("Invalid Command, use .hltv for commands");
      message.channel.send({ embeds: [embed] });
    }
  }
  else if(command == "player")
  {
    var outputStr = "";
    if(args[0] == "rankings" || args[0] == "ranking") // if user has entered ".player rankings"
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
        const embed = new Discord.MessageEmbed()
        .setTitle("Player Rankings")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
        .setDescription(outputStr);
        message.channel.send({ embeds: [embed] });
      });
    }
    else
    {
      HLTV.getPlayerByName({name: args[0]}).then((res)=>
      {
        var embed = new Discord.MessageEmbed()
        .setTitle(args[0] + " Player Profile")
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
        message.channel.send({ embeds: [embed] });
      }).catch((err) => {
        console.log(err);
        var embed = new Discord.MessageEmbed()
        .setTitle("Invalid Player")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
        .setDescription(`${args[0]} is not a valid playername. Please try again or visit hltv.org`);
        message.channel.send({ embeds: [embed] });
      });
    }
  }
  else if (command === "hltv")
  {
    if (args.length == 0)
    {
      var embed = new Discord.MessageEmbed()
      .setTitle("Help")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
      .addField('\u200b', `${titleSpacer}**Bot Commands**`)
      .addField(".hltv", "Lists all current commands", false)
      .addField(".hltv ping", "Displays the current ping to the bot & the API", false)
      .addField(".hltv stats", "Displays bot statistics, invite link and contact information", false)
      .addField('\u200b', `${titleSpacer}**Team Commands**`)
      .addField(".teams", "Lists all of the currently accepted teams", false)
      .addField(".teams rankings", "Displays the top 30 team rankings & recent position changes. 'ranking' is also accepted.", false)
      .addField(".[teamname]", "Displays the profile related to the input team", false)
      .addField(".[teamname] stats", "Displays the statistics related to the input team", false)
      .addField(".[teamname] maps", "Displays the map statistics related to the input team", false)
      .addField('\u200b', `${titleSpacer}**Player Commands**`)
      .addField(".player [playername]", "Displays player statistics from the given playername", false)
      .addField(".player rankings", "Displays the top 30 player rankings & recent position changes. 'ranking' is also accepted.",false)
      .addField('\u200b', `${titleSpacer}**Match Commands**`)
      .addField(".livematches", "Displays all currently live matches", false)
      .addField(".matches", "Displays all known scheduled matches", false)
      .addField(".results", "Displays the most recent match results", false)
      .addField(".events", "Displays info on current & upcoming events", false)
      .addField('\u200b', `${titleSpacer}**Info Commands**`)
      .addField(".threads", "Displays the most recent hltv user threads", false)
      .addField(".news", "Displays the most recent hltv news & match info", false)

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
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
      .addField("User Count", usercount.toString(), true)
      .addField("Bot User Count", botcount.toString(), true)
      .addField("Server Count", servercount.toString(), true)
      .addField("Channel Count", channelcount.toString(), true)
      .addField("Version", package.version.toString(), true)
      .addField("Uptime", func.getTime(client.uptime), true)
      .addField("Invite Link", "[Invite](https://discordapp.com/oauth2/authorize?client_id=548165454158495745&scope=bot&permissions=277025442816)", true)
      .addField("Support Link", "[GitHub](https://github.com/OhhLoz/HLTVBot)", true)
      .addField("Bot Page", "[Vote Here!](https://top.gg/bot/548165454158495745)", true)
      .addField("Donate", "[PayPal](https://www.paypal.me/LaurenceUre)", true)
      message.channel.send({ embeds: [embed] });
    }
    else
    {
      message.channel.send("Invalid Command, use .hltv for commands");
    }
  }
  else if (teamDictionary.hasOwnProperty(command.toUpperCase()))
  {
    var teamName = command.toUpperCase();
    var teamID = teamDictionary[teamName];

    // IF JUST TEAMNAME display a team overview
    if(args.length == 0)
    {
      HLTV.getTeam({id: teamID}).then(res =>
        {
          var playerRosterOutputStr = '';
          var embed = new Discord.MessageEmbed()
          .setTitle(teamName + " Profile")
          .setColor(0x00AE86)
          .setThumbnail(res.logo)
          //.setImage(res.coverImage)
          .setTimestamp()
          .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
          .setURL(`https://www.hltv.org/team/${teamID}/${teamName}`)
          .addField("Location", res.country.name == undefined ? "Not Available" : res.country.name)
          .addField("Facebook", res.facebook == undefined ? "Not Available" : res.facebook)
          .addField("Twitter",  res.twitter == undefined ? "Not Available" : res.twitter)
          .addField("Instagram",  res.instagram == undefined ? "Not Available" : res.instagram)
          for (var i = 0; i < res.players.length; i++)
          {
            playerRosterOutputStr += `[${res.players[i].name}](https://www.hltv.org/stats/players/${res.players[i].id}/${res.players[i].name})`
            if(i != res.players.length - 1)
              playerRosterOutputStr += ', ';
          }
          embed.addField("Players", playerRosterOutputStr);
          embed.addField("Rank", res.rank.toString());

          message.channel.send({ embeds: [embed] });
        });
    }
    else if (args[0] == "stats")     // If stats after teamname display a team stats page
    {
      HLTV.getTeamStats({id: teamID}).then(res =>
        {
          const embed = new Discord.MessageEmbed()
          .setTitle(teamName + " Stats")
          .setColor(0x00AE86)
          .setTimestamp()
          .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
          .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`)
          .addField("Maps Played", res.overview.mapsPlayed == undefined ? "Not Available" : res.overview.mapsPlayed.toString(), true)
          .addField("Wins", res.overview.wins == undefined ? "Not Available" : res.overview.wins.toString(), true)
          .addField("Losses", res.overview.losses == undefined ? "Not Available" : res.overview.losses.toString(), true)
          .addField("Kills", res.overview.totalKills == undefined ? "Not Available" : res.overview.totalKills.toString(), true)
          .addField("Deaths", res.overview.totalDeaths == undefined ? "Not Available" : res.overview.totalDeaths.toString(), true)
          .addField("KD Ratio", res.overview.kdRatio == undefined ? "Not Available" : res.overview.kdRatio.toString(), true)
          .addField("Average Kills Per Round", res.overview.totalKills == undefined || res.overview.roundsPlayed == undefined ? "Not Available" : (Math.round(res.overview.totalKills / res.overview.roundsPlayed * 100) / 100).toString(), true)
          .addField("Rounds Played", res.overview.roundsPlayed == undefined ? "Not Available" : res.overview.roundsPlayed.toString(), true)
          .addField("Overall Win%", res.overview.wins == undefined || res.overview.losses == undefined ? "Not Available" : (Math.round(res.overview.wins / (res.overview.losses + res.overview.wins) * 10000) / 100).toString() + "%", true)
          message.channel.send({ embeds: [embed] });
        });
    }
    else if (args[0] == "maps")     // If maps after teamname display a team maps page
    {
      HLTV.getTeamStats({id: teamID}).then(res =>
        {
          var currIndex = 0;
          var mapArr = [];
          var mapcount = 0;

          for (var mapKey in res.mapStats)
          {
            var map = res.mapStats[mapKey];
            mapArr[mapcount] = map;
            map.map_name = mapKey;
            map.team_id = res.id;
            map.team_name = res.name;
            mapcount++;
          }

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
    {
      message.channel.send("Invalid Command, use .hltv for commands");
    }
    //message.channel.send(command);
  }
  else if(command === "results")
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
  }
  else if (command === "matches")
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
  }
  else if (command === "livematches")
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
      .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()});

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
  }
  else if (command === "events")
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
  }
});

client.login(process.env.BOT_TOKEN);