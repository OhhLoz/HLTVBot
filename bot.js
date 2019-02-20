const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");
const { HLTV } = require('hltv');

client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
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

  // Let's go with a few common example commands! Feel free to delete or change those.

  if(command === "ping")
  {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Calculating");
    m.edit(`Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }

  if(command === "results")
  {
    const m = await message.channel.send("Calculating");
    HLTV.getResults({pages: 1}).then(res =>
    {
        console.log(res);
    });
  }

  if(command == "nip")
  {
    const m = await message.channel.send("Calculating");
    HLTV.getTeam({id: 4411}).then(res =>
    {
      console.log(res);
      const embed = new Discord.RichEmbed()
      .setTitle(res.name)
      .setColor(0x00AE86)
      .setThumbnail(res.logo)
      // .setImage(res.coverImage)
      .setTimestamp()
      .setURL(`https://www.hltv.org/team/${res.id}/${res.name}`)
      .addField("Nationality", res.location)
      .addField("Players", `${res.players[0].name}, ${res.players[1].name}, ${res.players[2].name}, ${res.players[3].name} & ${res.players[4].name}`)
      .addField("Rank", res.rank)
      .addField("Recent Matches", `(NIP ${res.recentResults[0].result} ${res.recentResults[0].enemyTeam.name}) \n \t\t(NIP ${res.recentResults[1].result} ${res.recentResults[1].enemyTeam.name}) \n \t\t(NIP ${res.recentResults[2].result} ${res.recentResults[2].enemyTeam.name})`)

      m.edit(embed);
      //message.channel.send({embed});
    });
  }

  if(command == "nipstats")
  {
    const m = await message.channel.send("Calculating");
    HLTV.getTeamStats({id: 4411}).then(res =>
    {
      console.log(res);
      const embed = new Discord.RichEmbed()
      .setTitle("NIP")
      .setColor(0x00AE86)
      .setTimestamp()
      .setURL(`https://www.hltv.org/team/4411/nip`)
      .addField("Maps Played", res.overview.mapsPlayed, true)
      .addField("Rounds Played", res.overview.roundsPlayed, true)
      .addField("Wins", res.overview.wins, true)
      .addField("Losses", res.overview.losses, true)
      .addField("Kills", res.overview.totalKills, true)
      .addField("Deaths", res.overview.totalDeaths, true)
      .addField("KD Ratio", res.overview.kdRatio, true)
      .addField("Average Kills Per Round", Math.round(res.overview.totalKills / res.overview.roundsPlayed * 100) / 100, true)
      .addField("Win%", Math.round(res.overview.wins / (res.overview.losses + res.overview.wins) * 10000) / 100, true)

      m.edit(embed);
    });
  }
});

client.login(config.token);