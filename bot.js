const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");
const { HLTV } = require('hltv');

const teamDictionary = require("./teams.json");
const mapDictionary = require("./maps.json");
const formatDictionary = require("./formats.json");

const versionNumber = "1.2.7";

var reverseTeamDictionary;

var id = function(x) {return x;};

var reverseMapFromMap = function(map, f) {
  return Object.keys(map).reduce(function(acc, k) {
    acc[map[k]] = (acc[map[k]] || []).concat((f || id)(k))
    return acc
  },{})
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
  client.user.setActivity(`use .hltv`);
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
  if(message.content.indexOf(config.prefix) !== 0) return;

  // Separate our command names, and command arguments
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

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
      .addField(".hltv stats", "Displays the statistics of the bot (servercount, usercount & channelcount)", false)
      .addField(".hltv version", "Displays the current version number of the bot", false)
      .addField(".hltv contact", "Displays the contact information (if there are any bugs to report)", false)
      .addField(".hltv invite", "Displays an invite link for the bot", false)
      .addField(".rankings [team,player]", "Displays the top 30 players' or team rankings", false)
      .addField(".teams", "Lists all of the currently accepted teams", false)
      .addField(".[teamname]", "Displays the profile related to the input team", false)
      .addField(".[teamname] stats", "Displays the statistics related to the input team", false)
      .addField(".[teamname] maps", "Displays the map statistics related to the input team", false)
      .addField(".[teamname] link", "Displays a link to the input teams HLTV page", false)
      .addField(".livematches", "Displays all currently live matches", false)
      .addField(".matches", "Displays the next 4 scheduled matches", false)
      .addField(".results", "Displays 3 most recent match results", false)

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

      var outputStr = `HLTVBot is currently serving ${usercount} users, in ${channelcount} channels of ${servercount} servers. Alongside ${botcount} bot brothers.`;
      message.channel.send(outputStr);
    }
    else if (args[0] == "version")
    {
      var outputStr = `HLTVBot is currently running version: ${versionNumber}`;
      //console.log(outputStr);
      message.channel.send(outputStr);
    }
    else if (args[0] == "contact")
    {
      var outputStr = `The best method of contacting is on the github page, issues can be made here: https://github.com/OhhLoz/HLTVBot`;
      //console.log(outputStr);
      message.channel.send(outputStr);
    }
    else if (args[0] == "invite")
    {
      var outputStr = `https://discordapp.com/oauth2/authorize?client_id=548165454158495745&scope=bot&permissions=330816`;
      //console.log(outputStr);
      message.channel.send(outputStr);
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

    if(args.length == 0)    // IF JUST TEAMNAME display a team overview
    {
      HLTV.getTeam({id: teamID}).then(res =>
        {
          //console.log(res);
          //console.log("\n\n\n ======================================================================== \n\n\n");
          const embed = new Discord.RichEmbed()
          .setTitle(teamName + " Profile")
          .setColor(0x00AE86)
          .setThumbnail(res.logo)
          //.setImage(res.coverImage)
          .setTimestamp()
          .setFooter("Sent by HLTVBot", client.user.avatarURL)
          .setURL(`https://www.hltv.org/team/${teamID}/${teamName}`)
          .addField("Location", res.location)
          .addField("Facebook", res.facebook)
          .addField("Twitter", res.twitter)
          .addField("Players", `${res.players[0].name}, ${res.players[1].name}, ${res.players[2].name}, ${res.players[3].name}, ${res.players[4].name}`)
          .addField("Rank", res.rank)
          // MAYBE ADD BO1 OR BO3?
          .addField("Recent Matches", `(${res.name} ${res.recentResults[0].result} ${res.recentResults[0].enemyTeam.name}) \n \t\t(${res.name} ${res.recentResults[1].result} ${res.recentResults[1].enemyTeam.name}) \n \t\t(${res.name} ${res.recentResults[2].result} ${res.recentResults[2].enemyTeam.name})`)
          message.channel.send({embed});
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
          //console.log(res);
          var embed = new Discord.RichEmbed()
          .setTitle(teamName + " Maps")
          .setColor(0x00AE86)
          .setTimestamp()
          .setFooter("Sent by HLTVBot", client.user.avatarURL)
          .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`);
          var loopcount = 0;
          for (var mapKey in res.mapStats)
          {
            // CHECK IF VALID MAP
            // TURN INTO FUNCTION?
            if (loopcount % 3 == 0)
            {
              embed = new Discord.RichEmbed()
              .setTitle(teamName + " Maps")
              .setColor(0x00AE86)
              .setTimestamp()
              .setFooter("Sent by HLTVBot", client.user.avatarURL)
              .setURL(`https://www.hltv.org/stats/teams/${teamID}/${teamName}`)
            }
            var map = res.mapStats[mapKey];
            var mapName = mapDictionary[mapKey];

            embed.addField(mapName, "==========================================================" , false);
            embed.addField("Wins", map.wins , true);
            embed.addField("Draws", map.draws , true);
            embed.addField("Losses", map.losses , true);
            embed.addField("Win Rate", map.winRate , true);
            embed.addField("Total Rounds", map.totalRounds , true);
            embed.addBlankField();

            loopcount++;
            // DUPLICATION BUG IF END % 3 == 0 as below is executed aswell
            if (loopcount % 3 == 0)
              message.channel.send({embed});
          }
          message.channel.send({embed});
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

  if (command == "livematches")
  {
    var livecount = 0;
    var liveArr = [];
    HLTV.getMatches().then((res) => {
      for (var matchKey in res)
      {
        var match = res[matchKey];
        if (match.live == true)
        {
          liveArr[livecount] = match;
          livecount++;
          // MAYBE INCLUDE LINKS TO TEAM / EVENT
        }
      }

      if (livecount == 0)
        embed.addField("Matches", "There are currently no live matches.", false);
      else
      {
        var loopcount = 0;
        var embed;
        for (var matchKey in liveArr)
        {
          var match = liveArr[matchKey];
          // CAN ONLY FIT 5 MATCHES PER EMBED MESSAGE
          if (loopcount % 5 == 0)
          {
            embed = new Discord.RichEmbed()
            .setTitle("Live Matches")
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter("Sent by HLTVBot", client.user.avatarURL)
          }

          // POPULATE EMBED
          embed.addField("Match", `${match.team1.name} vs ${match.team2.name}`, false);
          embed.addField("Format", `${match.format}`, false);
          var mapStr = "";
          for (var mapKey in match.maps)
          {
            var currMap = mapDictionary[match.maps[mapKey]]
            if (currMap == undefined)
              mapStr += match.maps[mapKey];
            else
              mapStr += currMap;

            if (mapKey != match.maps.length - 1)
              mapStr += ", ";
          }
          embed.addField("Map", `${mapStr}`, false);
          embed.addField("Event", `${match.event.name}`, false);

          // IF CURRENT MATCH IS NOT THE LAST ONE ADD A SEPERATOR (BLANK FIELD)
          if(matchKey != liveArr.length - 1)
            embed.addBlankField();

          loopcount++;
          // DUPLICATION BUG IF END % 5 == 0 as below is executed aswell
          if (loopcount % 5 == 0)
            message.channel.send({embed});
        }
      }
      message.channel.send({embed});
    });
  }

  if (command == "matches")
  {
    var matchcount = 0;
    var matchArr = [];
    HLTV.getMatches().then((res) => {
      for (var matchKey in res)
      {
        var match = res[matchKey];
        if (match.live != true)
        {
          matchArr[matchcount] = match;
          matchcount++;
          //console.log(match);
          //console.log("\n");

          // MAYBE INCLUDE LINKS TO TEAM / EVENT
          if (matchcount == 4) // CAN ONLY HAVE 4 MATCHES PER EMBED, SO I ONLY SEND 1 EMBED
            break;
        }
      }

      if (matchcount == 0)
        embed.addField("Matches", "There are currently no scheduled matches.", false);
      else
      {
        var loopcount = 0;
        var embed = new Discord.RichEmbed()
        .setTitle("Scheduled Matches")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter("Sent by HLTVBot", client.user.avatarURL);
        for (var matchKey in matchArr)
        {
          var match = matchArr[matchKey];
          // POPULATE EMBED
          var matchDate = new Date(match.date);
          embed.addField("Match", `${match.team1.name} vs ${match.team2.name}`, false);
          embed.addField("Date", `${matchDate.toString()}`, false);
          embed.addField("Format", `${formatDictionary[match.format]}`, false);
          var mapStr = "";
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
          embed.addField("Map", `${mapStr}`, false);
          embed.addField("Event", `${match.event.name}`, false);

          // IF CURRENT MATCH IS NOT THE LAST ONE ADD A SEPERATOR (BLANK FIELD)
          loopcount++;
          if(loopcount <= 3)
            embed.addBlankField();
        }
      }
      message.channel.send({embed});
    });
  }

  if(command === "results")
  {
    HLTV.getResults({pages: 1}).then((res) =>
    {
      if (matchcount == 0)
        embed.addField("Results", "There are currently no match results available.", false);
      else
      {
        var loopcount = 0;
        var embed = new Discord.RichEmbed()
        .setTitle("Recent Match Results")
        .setColor(0x00AE86)
        .setTimestamp()
        .setFooter("Sent by HLTVBot", client.user.avatarURL);
        for (var matchKey in res)
        {
          var match = res[matchKey];
          // POPULATE EMBED
          var matchDate = new Date(match.date);
          embed.addField("Match", `${match.team1.name} vs ${match.team2.name}`, false);
          embed.addField("Date", `${matchDate.toString()}`, false);
          embed.addField("Format", `${formatDictionary[match.format]}`, false);
          var mapStr = "";
          var isMapArray = Array.isArray(match.map);
          if (isMapArray)
          {
            for (var mapKey in match.map)
            {
              var currMap = mapDictionary[match.map[mapKey]]
              if (currMap == undefined)
                mapStr += "Unknown";
              else
                mapStr += currMap;

              if (mapKey != match.map.length - 1)
                mapStr += ", ";
            }
          }
          else
          {
            mapStr += "Unknown";
          }
          embed.addField("Map", `${mapStr}`, false);
          embed.addField("Event", `${match.event.name}`, false);
          embed.addField("Result", `${match.result}`, false);

          //console.log(match);
          //console.log("\n\n\n ======================================================================== \n\n\n");

          // IF CURRENT MATCH IS NOT THE LAST ONE ADD A SEPERATOR (BLANK FIELD)
          loopcount++;
          if(loopcount == 3)
            break;

          if(loopcount <= 3)
            embed.addBlankField();
        }
      }
      message.channel.send({embed});
    });
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
          var teamStr = "";
          if(teamDictionary.hasOwnProperty(rankObj.team.name.toUpperCase()))
              teamStr = `[${rankObj.team.name}](https://www.hltv.org/team/${rankObj.team.id}/${reverseTeamDictionary[rankObj.team.id][0]})`
          else
              teamStr = `${rankObj.team.name}`;
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
        .setTitle("Team Rankings")
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

  if(command === "debugmatches")
  {
    var currDate = new Date();
    var prevDate = new Date();
    var currDateStr = currDate.toISOString().slice(0,10);
    prevDate.setDate(currDate.getDate() - 1);
    var prevDateStr = prevDate.toISOString().slice(0,10);
    HLTV.getMatchesStats({startDate: `${prevDateStr}`, endDate: `${currDateStr}`}).then((res) =>
    {
      console.log(res);
      console.log("\n\n\n ======================================================================== \n\n\n");
    });
  }

  if(command === "debugresults")
  {
    HLTV.getResults({pages: 1}).then((res) =>
    {
      console.log(res);
      console.log("\n\n\n ======================================================================== \n\n\n");
    });
  }

});

client.login(config.token);