const Discord = require('discord.js');
const client = new Discord.Client();

const { HLTV } = require('hltv');

const teamDictionary = require("./teams.json");
const alternateTeamDictionary = require("./alternateteams.json");
const mapDictionary = require("./maps.json");
const formatDictionary = require("./formats.json");

const versionNumber = "1.4.3";
const hltvURL = "https://www.hltv.org";

var id = function(x) {return x;};

var reverseMapFromMap = function(map, f) {
  return Object.keys(map).reduce(function(acc, k) {
    acc[map[k]] = (acc[map[k]] || []).concat((f || id)(k))
    return acc
  },{})
}

let getTime = (milli) => {
  let time = new Date(milli);
  let hours = time.getUTCHours();
  let minutes = time.getUTCMinutes();
  let seconds = time.getUTCSeconds();
  let milliseconds = time.getUTCMilliseconds();
  return hours + "H " + minutes + "M " + seconds + "S";
}

var handlePages = (res, startIndex, code) => {
  var pageSize = 0;
  var embed = new Discord.RichEmbed()
      .setColor(0x00AE86)
      .setTimestamp();
  var liveArr = [];
  var livecount = 0;

  if(code == "r")
  {
    pageSize = 3;
    embed.setTitle("Match Results");
  }
  else if (code == "lm")
  {
    pageSize = 5;
    embed.setTitle("Live Matches");

    for (var matchKey in res)
    {
      var match = res[matchKey];
      if (match.live == true)
      {
        liveArr[livecount] = match;
        livecount++;
      }
    }
  }
  else if (code == "m")
  {
    pageSize = 3;
    embed.setTitle("Scheduled Matches");
  }

  for (var i = startIndex; i < startIndex+pageSize; i++)
    {
      var match = res[i];
      var pages = res.length/pageSize;

      if(code == "lm")
      {
        match = liveArr[i];
        pages = liveArr.length/pageSize;
      }

      if(match == null) //Error with live matches, assumes will have enough to fill 1 page so less than that throws an error
        return embed;

      // POPULATE EMBED
      var team1NameFormatted = match.team1.name.replace(/\s+/g, '-').toLowerCase();
      var team2NameFormatted = match.team2.name.replace(/\s+/g, '-').toLowerCase();
      var eventFormatted = match.event.name.replace(/\s+/g, '-').toLowerCase();

      embed.setFooter(`Page ${startIndex/pageSize + 1} of ${Math.ceil(pages) + 1}`, client.user.avatarURL);
      embed.addField(`Match`, `[${match.team1.name}](https://www.hltv.org/team/${match.team1.id}/${team1NameFormatted}) vs [${match.team2.name}](https://www.hltv.org/team/${match.team2.id}/${team2NameFormatted})`, false);
      if(code == "m")
      {
        var matchDate = new Date(match.date);
        if(match.live)
          matchDate = "Live";
        embed.addField("Date", `${matchDate.toString()}`, false);
      }
      embed.addField("Format", `${formatDictionary[match.format]}`, false);

      var mapStr = "";

      if (match.map != undefined)
      {
        var isMapArray = Array.isArray(match.map);
        if (isMapArray)
        {
          for (var mapKey in match.map)
          {
            var currMap = mapDictionary[match.map[mapKey]]
            if (currMap == undefined)
              mapStr += "Not Selected";
            else
              mapStr += currMap;

            if (mapKey != match.map.length - 1)
              mapStr += ", ";
          }
        }
        else
        {
          var currMap = mapDictionary[match.map];
          if (currMap == undefined)
            mapStr += "Not Selected";
          else
            mapStr += currMap;
        }
      }
      else if (match.maps != undefined)
      {
        var isMapArray = Array.isArray(match.maps);
        if (isMapArray)
        {
          for (var mapKey in match.maps)
          {
            var currMap = mapDictionary[match.maps[mapKey]]
            if (currMap == undefined)
              mapStr += "Not Selected";
            else
              mapStr += currMap;

            if (mapKey != match.maps.length - 1)
              mapStr += ", ";
          }
        }
        else
        {
          var currMap = mapDictionary[match.maps];
          if (currMap == undefined)
            mapStr += "Not Selected";
          else
            mapStr += currMap;
        }
      }
      else
          mapStr += "Not Selected";

      embed.addField("Map", `${mapStr}`, false);
      embed.addField("Event", `[${match.event.name}](https://www.hltv.org/events/${match.event.id}/${eventFormatted})`, false);

      if(code == "r")
        embed.addField("Result", `${match.result}`, false);

      if(i != startIndex+(pageSize - 1))
        embed.addBlankField();
    }
    return embed;
}

var handleMapPages = (res, startIndex, teamName, teamID, mapArr, mapNameArr) => {
  var pageSize = 3;
  var embed = new Discord.RichEmbed()
      .setColor(0x00AE86)
      .setTimestamp()
      .setTitle(teamName + " Maps")
      .setColor(0x00AE86)
      .setTimestamp()
      .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`);

      // console.log(`currIndex: ${startIndex}\n`);
      // console.log(`mapArr: ${mapArr}\n`);
      // console.log(`mapNameArr: ${mapNameArr}\n`);
      // console.log(`res: ${res}\n`);

  for (var i = startIndex; i < startIndex+pageSize; i++)
    {
      var map = mapArr[i];
      //console.log(map);
      var mapName = mapDictionary[mapNameArr[i]];
      //console.log(mapName);
      var pages = mapArr.length/pageSize;

      // if(map == null) //Error with live matches, assumes will have enough to fill 1 page so less than that throws an error
      //   return embed;

      embed.setFooter(`Page ${startIndex/pageSize + 1} of ${Math.ceil(pages)}`, client.user.avatarURL);

      // if (mapName == undefined)
      //   mapName = "Other";

      embed.addField(mapName, "==========================================================" , false);
      embed.addField("Wins", map.wins , true);
      embed.addField("Draws", map.draws , true);
      embed.addField("Losses", map.losses , true);
      embed.addField("Win Rate", map.winRate , true);
      embed.addField("Total Rounds", map.totalRounds , true);

      if(i != startIndex+(pageSize - 1))
        embed.addBlankField();
    }
    return embed;
}

client.on("ready", () =>
{
  var servercount = 0;
  var usercount = 0;
  var botcount = 0;
  var channelcount = 0;
  client.guilds.forEach((guild) =>
  {
    if (guild.id == "264445053596991498")
      return;

    servercount += 1;
    channelcount += guild.channels.filter(channel => channel.type != 'category').size;
    usercount += guild.members.filter(member => !member.user.bot).size;
    botcount += guild.members.filter(member => member.user.bot).size;
  })

  console.log(`HLTVBot is currently serving ${usercount} users, in ${channelcount} channels of ${servercount} servers. Alongside ${botcount} bot brothers.`);
  client.user.setActivity(`.hltv`, { type: 'LISTENING' });
  reverseTeamDictionary = reverseMapFromMap(teamDictionary);
});

client.on("guildCreate", guild =>
{
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

client.on("guildDelete", guild =>
{
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

client.on("message", async message =>
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
      //console.log(res);
      var embedcount = 0;
      var embed = new Discord.RichEmbed()
      .setTitle("Recent Threads")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter("Sent by HLTVBot", client.user.avatarURL);
      for (index in res)
      {
        if(res[index].category == 'news' || res[index].category == 'match')//Filter out matches and news, only want user threads
          break;
        if(res[index].title != undefined)
        {
          embed.addField(`${res[index].title}`, `[Link](${hltvURL + res[index].link}) Replies: ${res[index].replies} Category: ${res[index].category}`);
          embedcount++;
        }
        if(embedcount >= 24)
          return;
      }
      if (embedcount == 0)
        embed.setDescription("No Threads found, please try again later.")
      message.channel.send({embed});
    })
  }

  if(command == "news")
  {
    HLTV.getRecentThreads().then((res) =>
    {
      //console.log(res);
      var embedcount = 0;
      var embed = new Discord.RichEmbed()
      .setTitle("Recent News")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter("Sent by HLTVBot", client.user.avatarURL);
      for (index in res)
      {
        if(res[index].category == 'cs') //Filter out user threads
          break;
        if(res[index].title != undefined)
        {
          embed.addField(`${res[index].title}`, `[Link](${hltvURL + res[index].link}) Replies: ${res[index].replies} Category: ${res[index].category}`);
          embedcount++;
        }
        if(embedcount >= 24)
          return;
      }
      if (embedcount == 0)
        embed.setDescription("No News found, please try again later.")
      message.channel.send({embed});
    })
  }

  // Outputs valid teams the user can use
  if(command == "teams")
  {
    var embed = new Discord.RichEmbed()
      .setTitle("Valid Teams")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter("Sent by HLTVBot", client.user.avatarURL)
    var count = 1;
    var outputMsg = "";
    var teamKeysSorted = Object.keys(teamDictionary).sort();
    for (i = 0; i < teamKeysSorted.length; i++)
    {
      outputMsg += teamKeysSorted[i];
      if(count != Object.keys(teamDictionary).length)
        outputMsg += "\n";
      count++;
    }
    embed.setDescription(outputMsg);
    message.channel.send({embed});
  }

  // HLTV command represents commands pertinent to the actual bot, its functionality, diagnostics & statistics
  if(command === "hltv")
  {
    if (args.length == 0)
    {
      var embed = new Discord.RichEmbed()
      .setTitle("Help")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter("Sent by HLTVBot", client.user.avatarURL)
      .addField(".hltv", "Lists all current commands", false)
      .addField(".hltv ping", "Displays the current ping to the bot & the API", false)
      .addField(".hltv stats", "Displays bot statistics, invite link and contact information", false)
      .addBlankField()
      .addField(".rankings [team,player]", "Displays the top 30 players' or team rankings", false)
      .addField(".teams", "Lists all of the currently accepted teams", false)
      .addField(".[teamname]", "Displays the profile related to the input team", false)
      .addField(".[teamname] stats", "Displays the statistics related to the input team", false)
      .addField(".[teamname] maps", "Displays the map statistics related to the input team", false)
      .addField(".[teamname] link", "Displays a link to the input teams HLTV page", false)
      .addBlankField()
      .addField(".livematches", "Displays all currently live matches", false)
      .addField(".matches", "Displays all known scheduled matches", false)
      .addField(".results", "Displays the most recent match results", false)
      .addField(".threads", "Displays the most recent hltv user threads", false)
      .addField(".news", "Displays the most recent hltv news & match info", false)

      message.channel.send({embed});
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
      var servercount = 0;
      var usercount = 0;
      var botcount = 0;
      var channelcount = 0;
      client.guilds.forEach((guild) =>
      {
        if (guild.id == "264445053596991498")
          return;
        servercount += 1;
        channelcount += guild.channels.filter(channel => channel.type != 'category').size;
        usercount += guild.members.filter(member => !member.user.bot).size;
        botcount += guild.members.filter(member => member.user.bot).size;
      })
      var embed = new Discord.RichEmbed()
      .setTitle("Bot Stats")
      .setColor(0xff8d00)
      .setTimestamp()
      .setThumbnail(client.user.avatarURL)
      .setFooter("Sent by HLTVBot", client.user.avatarURL)
      .addField("User Count", usercount, true)
      .addField("Bot User Count", botcount, true)
      .addField("Server Count", servercount, true)
      .addField("Channel Count", channelcount, true)
      .addField("Version", versionNumber, true)
      .addField("Uptime", getTime(client.uptime), true)
      .addField("Invite Link", "[Invite](https://discordapp.com/oauth2/authorize?client_id=548165454158495745&scope=bot&permissions=330816)", true)
      .addField("Support Link", "[GitHub](https://github.com/OhhLoz/HLTVBot)", true)
      .addField("Bot Page", "[Vote Here!](https://top.gg/bot/548165454158495745)", true)
      .addField("Donate", "[Donatebot.io](https://donatebot.io/checkout/509391645226172420)", true)
      message.channel.send(embed);
    }
    else
    {
      message.channel.send("Invalid Command, use .hltv for commands");
    }
  }

  // IF COMMAND STARTS WITH TEAMNAME (.nip, .cloud9, etc)
  if(teamDictionary.hasOwnProperty(command.toUpperCase()))
  {
    var teamName = command.toUpperCase();
    var teamID = teamDictionary[teamName];

    // IF JUST TEAMNAME display a team overview
    if(args.length == 0)
    {
      HLTV.getTeam({id: teamID}).then(res =>
        {
          //console.log(res);
          //console.log("\n\n\n ======================================================================== \n\n\n");
          var embed = new Discord.RichEmbed()
          .setTitle(teamName + " Profile")
          .setColor(0x00AE86)
          //.setThumbnail(res.logo)
          //.setImage(res.coverImage)
          .setTimestamp()
          .setFooter("Sent by HLTVBot", client.user.avatarURL)
          .setURL(`https://www.hltv.org/team/${teamID}/${teamName}`)
          .addField("Location", res.location)
          .addField("Facebook", res.facebook)
          .addField("Twitter", res.twitter)
          .addField("Players", `[${res.players[0].name}](https://www.hltv.org/stats/players/${res.players[0].id}/${res.players[0].name}), [${res.players[1].name}](https://www.hltv.org/stats/players/${res.players[1].id}/${res.players[1].name}), [${res.players[2].name}](https://www.hltv.org/stats/players/${res.players[2].id}/${res.players[2].name}), [${res.players[3].name}](https://www.hltv.org/stats/players/${res.players[3].id}/${res.players[3].name}), [${res.players[4].name}](https://www.hltv.org/stats/players/${res.players[4].id}/${res.players[4].name})`)
          .addField("Rank", res.rank);
          if(res.recentResults === undefined || res.recentResults.length == 0)
          {
            message.channel.send({embed});
          }
          else
          {
            embed.addField("Recent Matches", `(${res.name} ${res.recentResults[0].result} ${res.recentResults[0].enemyTeam.name}) \n \t\t(${res.name} ${res.recentResults[1].result} ${res.recentResults[1].enemyTeam.name}) \n \t\t(${res.name} ${res.recentResults[2].result} ${res.recentResults[2].enemyTeam.name})`);
            message.channel.send({embed});
          }
        });
    }
    else if (args[0] == "stats")     // If stats after teamname display a team stats page
    {
      HLTV.getTeamStats({id: teamID}).then(res =>
        {
          //console.log(res);
          //console.log("\n\n\n ======================================================================== \n\n\n");
          const embed = new Discord.RichEmbed()
          .setTitle(teamName + " Stats")
          .setColor(0x00AE86)
          .setTimestamp()
          .setFooter("Sent by HLTVBot", client.user.avatarURL)
          .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`)
          .addField("Maps Played", res.overview.mapsPlayed, true)
          .addField("Rounds Played", res.overview.roundsPlayed, true)
          .addField("Wins", res.overview.wins, true)
          .addField("Losses", res.overview.losses, true)
          .addField("Kills", res.overview.totalKills, true)
          .addField("Deaths", res.overview.totalDeaths, true)
          .addField("KD Ratio", res.overview.kdRatio, true)
          .addField("Average Kills Per Round", Math.round(res.overview.totalKills / res.overview.roundsPlayed * 100) / 100, true)
          .addField("Win%", Math.round(res.overview.wins / (res.overview.losses + res.overview.wins) * 10000) / 100, true)
          message.channel.send({embed});
        });
    }
    else if (args[0] == "maps")     // If maps after teamname display a team maps page
    {
      HLTV.getTeamStats({id: teamID}).then(res =>
        {
          // console.log(res);
          // console.log("\n\n\n\n");
          var currIndex = 0;
          var mapArr = [];
          var mapNameArr = [];
          var mapcount = 0;

          for (var mapKey in res.mapStats)
          {
            var map = res.mapStats[mapKey];
            mapArr[mapcount] = map;
            mapNameArr[mapcount] = mapKey;
            mapcount++;
          }

          var embed = handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr);
          var originalAuthor = message.author;
          message.channel.send({embed}).then((message) =>
          {
            message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));

            const collector = new Discord.ReactionCollector(message, (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id), {
              time: 60000, // stop automatically after one minute
            });

            collector.on('collect', (reaction, user) =>
            {
              switch (reaction.emoji.name)
              {
                case reactionControls.PREV_PAGE:
                {
                  if (currIndex - 3 >= 0)
                    currIndex-=3;
                  message.edit(handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr));
                  break;
                }
                case reactionControls.NEXT_PAGE:
                {
                  if (currIndex + 3 <= mapArr.length - 1)
                    currIndex+=3;
                  message.edit(handleMapPages(res, currIndex, teamName, teamID, mapArr, mapNameArr));
                  break;
                }
                case reactionControls.STOP:
                {
                  // stop listening for reactions
                  message.delete();
                  collector.stop();
                  break;
                }
              }
            });

            collector.on('stop', async () => {
                await message.clearReactions();
            });
          });
        });
    }
    else if (args[0] == "link")     // If link after teamname send a link to the team page
    {
      message.channel.send(`https://www.hltv.org/team/${teamID}/${teamName}`);
    }
    else  // Error catching for incorrect command
    {
      message.channel.send("Invalid Command, use .hltv for commands");
    }
    //message.channel.send(command);
  }

  if(command == "rankings")
  {
    if(args[0] == "team")
    {
      var outputStr = "";
      HLTV.getTeamRanking().then((res) => {
        //console.log(res);
        for (var rankObjKey in res)
        {
          var rankObj = res[rankObjKey];
          var teamStr = `[${rankObj.team.name}](https://www.hltv.org/team/${rankObj.team.id}/${rankObj.team.name.replace(/\s+/g, '')})`;
          outputStr += `${rankObj.place}. ${teamStr} (${rankObj.change})\n`
        }
        const embed = new Discord.RichEmbed()
        .setTitle("Team Rankings")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter("Sent by HLTVBot", client.user.avatarURL)
        .setDescription(outputStr);
        message.channel.send({embed});
      });
    }
    else if(args[0] == "player")
    {
      HLTV.getPlayerRanking({startDate: '', endDate: '', rankingFilter: 'Top30'}).then((res) => {
        //console.log(res);
        var count = 1;
        var outputStr = "";
        for (var playerObjKey in res)
        {
          var playerObj = res[playerObjKey];
          outputStr += `${count}. [${playerObj.name}](https://www.hltv.org/stats/players/${playerObj.id}/${playerObj.name}) (${playerObj.rating})\n`
          if (count == 30)
            break;
          count++;
        }
        const embed = new Discord.RichEmbed()
        .setTitle("Player Rankings")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter("Sent by HLTVBot", client.user.avatarURL)
        .setDescription(outputStr);
        message.channel.send({embed});
      });
    }
    else
    {
      message.channel.send("Invalid Command, use .hltv for commands");
    }
  }

  const reactionControls = {
    PREV_PAGE: '⬅',
    NEXT_PAGE: '➡',
    STOP: '⏹',
}

  if(command === "results")
  {
    HLTV.getResults({pages: 1}).then((res) =>
    {
      //console.log(res);
      var currIndex = 0;
      var embed = handlePages(res, currIndex, "r");
      var originalAuthor = message.author;
      message.channel.send({embed}).then((message) =>
      {
        message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));

        const collector = new Discord.ReactionCollector(message, (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id), {
          time: 60000, // stop automatically after one minute
        });

        collector.on('collect', (reaction, user) =>
        {
          switch (reaction.emoji.name)
          {
            case reactionControls.PREV_PAGE:
            {
              if (currIndex - 3 >= 0)
                currIndex-=3;
              message.edit(handlePages(res, currIndex, "r"));
              break;
            }
            case reactionControls.NEXT_PAGE:
            {
              if (currIndex + 3 <= res.length)
                currIndex+=3;
              message.edit(handlePages(res, currIndex, "r"));
              break;
            }
            case reactionControls.STOP:
            {
              // stop listening for reactions
              message.delete();
              collector.stop();
              break;
            }
          }
        });

        collector.on('stop', async () => {
            await message.clearReactions();
        });
      });
    });
  }

  if(command === "matches")
  {
    HLTV.getMatches().then((res) =>
    {
      //console.log(res);
      var currIndex = 0;
      var embed = handlePages(res, currIndex, "m");
      var originalAuthor = message.author;
      message.channel.send({embed}).then((message) =>
      {
        message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));

        const collector = new Discord.ReactionCollector(message, (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id), {
          time: 60000, // stop automatically after one minute
        });

        collector.on('collect', (reaction, user) =>
        {
          switch (reaction.emoji.name)
          {
            case reactionControls.PREV_PAGE:
            {
              if (currIndex - 3 >= 0)
                currIndex-=3;
              message.edit(handlePages(res, currIndex, "m"));
              break;
            }
            case reactionControls.NEXT_PAGE:
            {
              if (currIndex + 3 <= res.length)
                currIndex+=3;
              message.edit(handlePages(res, currIndex, "m"));
              break;
            }
            case reactionControls.STOP:
            {
              // stop listening for reactions
              message.delete();
              collector.stop();
              break;
            }
          }
        });

        collector.on('stop', async () => {
            await message.clearReactions();
        });
      });
    });
  }

  if(command === "livematches")
  {
    HLTV.getMatches().then((res) =>
    {
      //console.log(res);
      var currIndex = 0;
      var embed = handlePages(res, currIndex, "lm");
      var originalAuthor = message.author;
      message.channel.send({embed}).then((message) =>
      {
        message.react('⬅').then(() => message.react('⏹').then(() => message.react('➡')));

        const collector = new Discord.ReactionCollector(message, (reaction, user) => (Object.values(reactionControls).includes(reaction.emoji.name) && user.id == originalAuthor.id), {
          time: 60000, // stop automatically after one minute
        });

        collector.on('collect', (reaction, user) =>
        {
          switch (reaction.emoji.name)
          {
            case reactionControls.PREV_PAGE:
            {
              if (currIndex - 5 >= 0)
                currIndex-=5;
              message.edit(handlePages(res, currIndex, "lm"));
              break;
            }
            case reactionControls.NEXT_PAGE:
            {
              if (currIndex + 5 <= res.length)
                currIndex+=5;
              message.edit(handlePages(res, currIndex, "lm"));
              break;
            }
            case reactionControls.STOP:
            {
              // stop listening for reactions
              message.delete();
              collector.stop();
              break;
            }
          }
        });

        collector.on('stop', async () => {
            await message.clearReactions();
        });
      });
    });
  }
});

client.login(process.env.BOT_TOKEN);