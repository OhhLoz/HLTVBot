//    LIBRARIES & FUNCTIONS
const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const func = require("./functions.js");
const fs = require("fs");
const database = require("./databaseWrapper.js");

//   SET TRUE WHEN TESTING TO DISABLE TOPGG Posting & TO USE TEST BOT TOKEN
var TESTING = true;

//    DATA IMPORT
const package = require("./package.json");
const COMMANDCODE = require("./commandcodes.json");

//    GLOBAL VARIABLES
var botData =
{
  servercount: 0,
  usercount: 0,
  botcount: 0,
  channelcount: 0,
  version: package.version,
  hltvURL: "https://www.hltv.org",
  topggVoteURL: "https://top.gg/bot/548165454158495745/vote",
  titleSpacer: "\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800",
  interactionRow: {},
  reactionControls:
  {
    PREV_PAGE: '⬅',
    NEXT_PAGE: '➡',
    STOP: '⏹',
  },
  COMMANDCODE: COMMANDCODE,
  hltvIMG: ""
}

const row = new Discord.MessageActionRow()
.addComponents(
  new Discord.MessageButton()
  .setStyle('LINK')
  .setLabel("Vote!")
  .setURL(botData.topggVoteURL),
  new Discord.MessageButton()
  .setCustomId(botData.reactionControls.PREV_PAGE)
  .setStyle('SECONDARY')
  .setLabel(" ")
  .setEmoji(botData.reactionControls.PREV_PAGE),
  new Discord.MessageButton()
  .setCustomId(botData.reactionControls.STOP)
  .setStyle('SECONDARY')
  .setLabel(" ")
  .setEmoji(botData.reactionControls.STOP),
  new Discord.MessageButton()
  .setCustomId(botData.reactionControls.NEXT_PAGE)
  .setStyle('SECONDARY')
  .setLabel(" ")
  .setEmoji(botData.reactionControls.NEXT_PAGE),
  new Discord.MessageButton()
  .setStyle('LINK')
  .setLabel("HLTV")
  .setURL(botData.hltvURL)
);

if(!TESTING)
{
  // handle top.gg stat posting
  const { AutoPoster } = require('topgg-autoposter');
  AutoPoster(process.env.TOPGG_TOKEN, client);

  // ap.on('posted', (stats) =>
  // {
  //   console.log(`Posted stats to Top.gg | ${stats.serverCount} servers`)
  // })
}
else
{
  const testConfig = require('./config.json');
  process.env.prefix = testConfig.prefix;
  process.env.BOT_TOKEN = testConfig.BOT_TOKEN;
  process.env.DATABASE_URL = testConfig.DATABASE_URL;
  process.env.DISCORDBOTS_TOKEN = testConfig.DISCORDBOTS_TOKEN;
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
  botData.interactionRow = row;

  const guild = client.guilds.cache.get('509391645226172420'); //development server guildid

  if(TESTING)
    guild.commands.set(commandsArr);
  else
    client.application.commands.set(commandsArr);

  func.postGuildCount(client.user.id, botData.servercount, process.env.DISCORDBOTS_TOKEN);
  console.log(`HLTVBot v${botData.version} is currently serving ${botData.usercount} users, in ${botData.channelcount} channels of ${botData.servercount} servers. Alongside ${botData.botcount} bot brothers.`);
  client.user.setActivity(`${botData.servercount} servers | /help | re-add for slash command permissions`, { type: 'WATCHING' });
});

client.on("guildCreate", guild =>
{
  botData = func.checkStats(guild, botData, true);
  func.postGuildCount(client.user.id, botData.servercount, process.env.DISCORDBOTS_TOKEN);
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members! Guild Count:${botData.servercount}`);
  client.user.setActivity(`${botData.servercount} servers | /help | re-add for slash command permissions`, { type: 'WATCHING' });
});

client.on("guildDelete", guild =>
{
  botData = func.checkStats(guild, botData, false);
  func.postGuildCount(client.user.id, botData.servercount, process.env.DISCORDBOTS_TOKEN);
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id}). This guild had ${guild.memberCount} members! Guild Count:${botData.servercount}`);
  client.user.setActivity(`${botData.servercount} servers | /help | re-add for slash command permissions`, { type: 'WATCHING' });
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
    .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
    .setDescription(`An error occurred whilst executing slash command.\nPlease try again or visit [hltv.org](${botData.hltvURL})\nIf this persists please re-add the bot to the server to refresh bot permissions.`);
    if(interaction.deferred)
      await interaction.editReply({ embeds: [embed] });
    else
      await interaction.reply({ embeds: [embed] });
  }
})

client.login(process.env.BOT_TOKEN);