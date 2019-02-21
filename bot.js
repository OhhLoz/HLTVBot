const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");
const { HLTV } = require('hltv');

var matchCache;
var resultCache;

// MAYBE MOVE THESE TO EXTERNAL FILE
var teamDictionary =
{
    "NIP": 4411,
    "ASTRALIS": 6665,
    "LIQUID" : 5973,
    "NAVI" : 4608,
    "NRG" : 6673,
    "FAZE" : 6667,
    "CLOUD9" : 5752,
    "RENEGADES" : 6211,
    "ENCE" : 4869,
    "NORTH" : 7533,
    "MIBR" : 9215,
    "VITALITY" : 9565,
    "FNATIC" : 4991,
    "BIG" : 7532,
    "AVANGAR" : 8120,
    "G2" : 5995,
    "TYLOO" : 4863,
    "HELLRAISERS" : 5310,
    "COMPLEXITY" : 5005
};

var mapDictionary =
{
    "inf" : "Inferno",
    "d2" : "Dust 2",
    "nuke" : "Nuke",
    "trn" : "Train",
    "mrg" : "Mirage",
    "cch" : "Cache",
    "ovp" : "Overpass",
    "cbl" : "Cobblestone",
    "-" : "Other"
};

client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} servers.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  //client.user.setActivity(`Serving ${client.guilds.size} servers`);
  client.user.setActivity(`use .help`);
  HLTV.getMatches().then((res) => {
    matchCache = res;
  });
  HLTV.getResults({pages: 1}).then((res) => {
    resultCache = res;
  });
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  //client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  //client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("message", async message =>
{
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();


  // MAYBE REMOVE HLTVBOT PREFIX
  if(command === "hltvbot")
  {
    if (args[0] == "ping")
    {
      // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
      // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
      const m = await message.channel.send("Calculating");
      m.edit(`Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
    }
    else if (args[0] == "stats")
    {
      var outputStr = `HLTVBot is currently serving ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} servers.`;
      console.log(outputStr);
      message.channel.send(outputStr);
    }
    else if (args[0] == "help")
    {
      message.channel.send("HELP");
    }
    else
    {
      message.channel.send("Invalid Command, use .help for commands");
    }
  }

  if(teamDictionary.hasOwnProperty(command.toUpperCase()))
  {
    var teamName = command.toUpperCase();
    var teamID = teamDictionary[teamName];

    if(args.length == 0)
    {
      HLTV.getTeam({id: teamID}).then(res =>
        {
          console.log(res);
          console.log("\n\n\n ======================================================================== \n\n\n");
          const embed = new Discord.RichEmbed()
          .setTitle(teamName + " Profile")
          .setColor(0x00AE86)
          .setThumbnail(res.logo)
          // .setImage(res.coverImage)
          .setTimestamp()
          .setURL(`https://www.hltv.org/team/${teamID}/${teamName}`)
          .addField("Nationality", res.location)
          .addField("Players", `${res.players[0].name}, ${res.players[1].name}, ${res.players[2].name}, ${res.players[3].name}, ${res.players[4].name}`)
          .addField("Rank", res.rank)
          // MAYBE ADD BO1 OR BO3?
          .addField("Recent Matches", `(${res.name} ${res.recentResults[0].result} ${res.recentResults[0].enemyTeam.name}) \n \t\t(${res.name} ${res.recentResults[1].result} ${res.recentResults[1].enemyTeam.name}) \n \t\t(${res.name} ${res.recentResults[2].result} ${res.recentResults[2].enemyTeam.name})`)
          message.channel.send({embed});
        });
    }
    else if (args[0] == "stats")
    {
      HLTV.getTeamStats({id: teamID}).then(res =>
        {
          console.log(res);
          console.log("\n\n\n ======================================================================== \n\n\n");
          const embed = new Discord.RichEmbed()
          .setTitle(teamName + " Stats")
          .setColor(0x00AE86)
          .setTimestamp()
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
    else if (args[0] == "maps")
    {
      HLTV.getTeamStats({id: teamID}).then(res =>
        {
          console.log(res);
          var embed;
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
            // embed.addField("Win Percentage After First Kill", map.roundWinPAfterFirstKill , true);
            // embed.addField("Win Percentage After First Death", map.roundWinPAfterFirstDeath , true);
            embed.addBlankField();

            loopcount++;
            if (loopcount % 3 == 0)
              message.channel.send({embed});
          }
        });
    }
    else if (args[0] == "link")
    {
      message.channel.send(`https://www.hltv.org/team/${teamID}/${teamName}`);
    }
    else
    {
      message.channel.send("Invalid Command, use .help for commands");
    }
    //message.channel.send(command);
  }

  if(command === "results")
  {
    console.log(resultCache);
    console.log("\n\n\n ======================================================================== \n\n\n");
  }

  if(command === "matches")
  {
    console.log(matchCache);
    console.log("\n\n\n ======================================================================== \n\n\n");
  }

  // if(command === "matchesstats")
  // {
  //   var currDate = new Date();
  //   var prevDate = new Date();
  //   var currDateStr = currDate.toISOString().slice(0,10);
  //   prevDate.setDate(currDate.getDate() - 1);
  //   var prevDateStr = prevDate.toISOString().slice(0,10);
  //   HLTV.getMatchesStats({startDate: `${prevDateStr}`, endDate: `${currDateStr}`}).then((res) => {
  //     console.log(res);
  //     console.log("\n\n\n ======================================================================== \n\n\n");
  //   });
  // }



  // IF COMMAND IS A TEAM LINK THEIR TEAM PROFILE

  if(command == "teams")
  {
    // SORT OUTPUT ALPHABETICALLY?
    var outputMsg = "Valid Teams: ";
    var count = 1;
    for (var teamName in teamDictionary)
    {
      outputMsg += teamName;
      if(count != Object.keys(teamDictionary).length)
        outputMsg += ", ";
      count++;
    }
    message.channel.send(outputMsg);
  }
});

client.login(config.token);