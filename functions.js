const { MessageEmbed, MessageAttachment } = require('discord.js');
const fetch = require("node-fetch");
const COMMANDCODE = require("./commandcodes.json");
const mapDictionary = require("./maps.json");
const formatDictionary = require("./formats.json");
const hltvURL = "https://www.hltv.org";
//const nodeHtmlToImage = require('node-html-to-image')

var id = function(x) {return x;};

/**
 * Returns a reversed hashmap from an input hashmap.
 *
 * @param {HashMap}   map           input hashmap to be reversed.
 * @param {function}   [f]          optional function parameter.
 *
 * @return {HashMap}                Returns the reversed hashmap.
 */
var reverseMapFromMap = function(map, f) {
  return Object.keys(map).reduce(function(acc, k) {
    acc[map[k]] = (acc[map[k]] || []).concat((f || id)(k))
    return acc
  },{})
}

/**
 * Formats the time given (in milliseconds) to a human readable string.
 *
 * @param {number}   milli           input time in milliseconds.
 *
 * @return {string}                  Returns the formatted time as a string.
 */
let getTime = (milli) => {
  let time = new Date(milli);
  let hours = time.getUTCHours();
  let minutes = time.getUTCMinutes();
  let seconds = time.getUTCSeconds();
  let milliseconds = time.getUTCMilliseconds();
  return hours + "H " + minutes + "M " + seconds + "S";
}

/**
 * Aims to provide page functionality to the published Discord embeds.
 *
 * Based on the 'code' parameter, the embed can only have a certain amount of results per page. startIndex is used to ensure a different startIndex can be provided to move along the pages. The res object is used to populated the pages alongside the other parameters.
 *
 * @param {Object}   res            Object containing the data to be formatted into pages.
 * @param {int}      startIndex     Which index within the Object to start populating the pages with.
 * @param {string}   code           An identifier used to determine where the function was called from and changes functionality accordingly.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
var handlePages = (res, startIndex, code) => {
  var pageSize = 0;
  var embed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTimestamp();

  if(code == COMMANDCODE.RESULTS)
  {
    pageSize = 3;
    embed.setTitle("Match Results from the Last Week");
    embed.setURL(`${hltvURL}/results`);
  }
  else if (code == COMMANDCODE.LIVEMATCHES)
  {
    pageSize = 5;
    embed.setTitle("Live Matches");
    embed.setURL(`${hltvURL}/matches`);
  }
  else if (code == COMMANDCODE.MATCHES)
  {
    pageSize = 3;
    embed.setTitle("Scheduled Matches");
    embed.setURL(`${hltvURL}/matches`);
  }

  for (var i = startIndex; i < startIndex+pageSize; i++)
  {
    var match = res[i];
    var pages = res.length/pageSize;
    var matchOutputStr = "Not Available"
    var team1NameFormatted = "Not Available"
    var team2NameFormatted = "Not Available"
    var matchURLStr = hltvURL;
    var eventFormatted = "Unknown"

    if(match == null) //Error with live matches, assumes will have enough to fill 1 page so less than that throws an error
      return embed;

    // TEMPORARY CODE FOR ISSUE #73
    if (match.team1 != null && match.team2 != null)
    {
      // POPULATE EMBED
      team1NameFormatted = match.team1.name.replace(/\s+/g, '-').toLowerCase();
      team2NameFormatted = match.team2.name.replace(/\s+/g, '-').toLowerCase();
      matchOutputStr = `[${match.team1.name}](${hltvURL}/team/${match.team1.id}/${team1NameFormatted}) vs [${match.team2.name}](${hltvURL}/team/${match.team2.id}/${team2NameFormatted})`
      if(match.id != null)
      {
        matchURLStr += "/matches/" + match.id.toString() + "/" + team1NameFormatted + "-vs-" + team2NameFormatted;
        matchOutputStr += " [[Match Link](" + matchURLStr + ")]"
      }
    }

    if (match.event != undefined)
    {
      eventFormatted = match.event.name.replace(/\s+/g, '-').toLowerCase();
      matchURLStr += "-" + eventFormatted;
    }

    embed.setFooter({text: `Page ${startIndex/pageSize + 1} of ${Math.ceil(pages)}`, iconURL: "https://cdn.discordapp.com/avatars/548165454158495745/222c8d9ccac5d194d8377c5da5b0f95b.png?size=4096"});
    embed.addField(`Match`, `${matchOutputStr}`, false);

    if(code == COMMANDCODE.MATCHES || code == COMMANDCODE.RESULTS)
    {
      var matchDate = new Date(match.date);
      if(match.live)
        matchDate = "Live";
      else
        matchDate = matchDate.toUTCString()
      embed.addField("Date", `${matchDate}`, false);
    }
    embed.addField("Format", `${formatDictionary[match.format]}`, false);

    var mapStr = "";

    if (match.map != undefined)
    {
      var isMapArray = Array.isArray(match.map); //Some HLTVAPI endpoints return a map array whereas others return a map string
      if (isMapArray)
      {
        for (var mapKey in match.map)
        {
          var currMap = mapDictionary[match.map[mapKey]]
          if (currMap != undefined)
            mapStr += currMap;

          if (mapKey != match.map.length - 1)
            mapStr += ", ";
        }
      }
      else
      {
        var currMap = mapDictionary[match.map];
        if (currMap != undefined)
          mapStr += currMap;
      }
    }
    else if (match.maps != undefined) //Some HLTVAPI endpoints return a OBJ.maps array as opposed to a OBJ.map array, needs verification on newest version 2.20.0 to see if this fallback code is necessary
    {
      var isMapArray = Array.isArray(match.maps);
      if (isMapArray)
      {
        for (var mapKey in match.maps)
        {
          var currMap = mapDictionary[match.maps[mapKey]]
          if (currMap != undefined)
            mapStr += currMap;

          if (mapKey != match.maps.length - 1)
            mapStr += ", ";
        }
      }
      else
      {
        var currMap = mapDictionary[match.maps];
        if (currMap != undefined)
          mapStr += currMap;
      }
    }

    if (mapStr != "")
      embed.addField("Map", `${mapStr}`, false);


    if (code == COMMANDCODE.MATCHES || code == COMMANDCODE.LIVEMATCHES)
    {
      if (match.event != undefined)
      {
        embed.addField("Event", `[${match.event.name}](${hltvURL}/events/${match.event.id}/${eventFormatted})`, false);
      }
      else
          embed.addField("Event", `${eventFormatted}`, false);

      if (match.title != undefined)
          embed.addField("Title", match.title, false);
    }

    if(code == COMMANDCODE.RESULTS)
      embed.addField("Result", `${match.team1.name} ${match.result.team1.toString()} - ${match.result.team2.toString()} ${match.team2.name}`, false);

    if(i != startIndex+(pageSize - 1))
      embed.addField('\u200b', '\u200b');
  }
  return embed;
}

/**
 * Aims to provide page functionality to the published Discord map embeds.
 *
 * startIndex is used to ensure a different startIndex can be provided to move along the pages. The res object contains the data to be published. teamName, teamID, mapArr and mapNameArr
 *
 * @param {int}      startIndex     Which index within the Object to start populating the pages with.
 * @param {string}   teamName       The name of the team that this command was called for.
 * @param {int}      teamID         The ID of the team that this command was called for.
 * @param {Object[]}   mapArr       An object array containing all the map objects the team has played.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
var formatMapPageEmbed = (startIndex, teamName, teamID, mapArr) =>
{
  var pageSize = 3;
  var embed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTimestamp()
      .setTitle(teamName + " Maps")
      .setURL(`${hltvURL}/stats/teams/${teamID}/${teamName.replace(/\s+/g, '-').toLowerCase()}`);

  var footerStr = ""

  for (var i = startIndex; i < startIndex+pageSize; i++)
    {
      var map = mapArr[i];
      var pages = mapArr.length/pageSize;

      footerStr = `Page ${startIndex/pageSize + 1} of ${Math.ceil(pages)}`;
      if(map == null) //Error with live matches, assumes will have enough to fill 1 page so less than that throws an error
        break;

      var mapName = mapDictionary[map.map_name];

      if (mapName == undefined)
         mapName = "Other";

      if (map != null)
      {
        embed.addFields
        (
          {name: mapName, value: "=========================================================", inline:false},
          {name: "Wins", value: map.wins == undefined ? "Not Available" : map.wins.toString(), inline:true},
          {name: "Draws", value: map.draws == undefined ? "Not Available" : map.draws.toString(), inline:true},
          {name: "Losses", value: map.losses == undefined ? "Not Available" : map.losses.toString(), inline:true},
          {name:"Win Rate", value: map.winRate == undefined ? "Not Available" : map.winRate.toString() + "%", inline:true},
          {name:"Total Rounds", value: map.totalRounds == undefined ? "Not Available" : map.totalRounds.toString(), inline:true},
        )
      }

      if(i != startIndex+(pageSize - 1) && i != mapArr.length-1 && map!=null)
        embed.addField('\u200b', '\u200b');
    }
    footerStr += " - Last Updated ";
    if(mapArr[0].updated_at != undefined)
      footerStr += getTime(Date.now() - new Date(mapArr[0].updated_at).getTime()) + " Ago"
    else
      footerStr += "Now"
    embed.setFooter({text: footerStr, iconURL: "https://cdn.discordapp.com/avatars/548165454158495745/222c8d9ccac5d194d8377c5da5b0f95b.png?size=4096"});
    return embed;
}

/**
 * Aims to provide page functionality to the published Discord event embeds.
 *
 * startIndex is used to ensure a different startIndex can be provided to move along the pages.
 *
 * @param {Object}   eventArray     Object containing the events to be formatted into pages.
 * @param {int}      startIndex     Which index within the Object to start populating the pages with.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
var handleEventPages = (eventArray, startIndex) =>
{
  var pageSize = 3;
  var embed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTimestamp()
      .setTitle("Events")
      .setURL(`${hltvURL}/events`);

  for (var i = startIndex; i < startIndex+pageSize; i++)
    {
      var event = eventArray[i];
      var pages = eventArray.length/pageSize;

      embed.setFooter({text: `Page ${startIndex/pageSize + 1} of ${Math.ceil(pages)}`, iconURL: "https://cdn.discordapp.com/avatars/548165454158495745/222c8d9ccac5d194d8377c5da5b0f95b.png?size=4096"});

      if(event == undefined)
        break;
      var eventNameURLFormat = event.name.replace(/\s+/g, '-').toLowerCase();
      var matchStartDate;
      var matchEndDate;

      if(event.dateStart != undefined)
        matchStartDate = new Date(event.dateStart);
      else
        matchStartDate = "Unknown";

      if(event.dateEnd != undefined)
        matchEndDate = new Date(event.dateEnd);
      else
        matchEndDate = "Unknown";

      embed.addFields
      (
        {name:"Name", value: `[${event.name}](${hltvURL}/events/${event.id}/${eventNameURLFormat})`},
        {name:"Start", value: matchStartDate.toUTCString()},
        {name:"End", value: matchEndDate.toUTCString()}
      )

      if (event.prizePool)
        embed.addField("Prize Pool", event.prizePool)
      if (event.numberOfTeams)
        embed.addField("Number of Teams", event.numberOfTeams.toString())
      if (event.location)
        embed.addField("Location", event.location.name)

      if(i != startIndex+(pageSize - 1))
        embed.addField('\u200b', '\u200b');
    }
    return embed;
}

/**
 * Aims to provide page functionality to the published Discord news embeds.
 *
 * startIndex is used to ensure a different startIndex can be provided to move along the pages.
 *
 * @param {Object}   newsArray     Object containing the news to be formatted into pages.
 * @param {int}      startIndex     Which index within the Object to start populating the pages with.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
var handleNewsPages = (newsArray, startIndex) =>
{
  var pageSize = 8;
  var embed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTimestamp()
      .setTitle("News")
      .setColor(0x00AE86)
      .setTimestamp()
      .setURL(`${hltvURL}/news`);

  for (var i = startIndex; i < startIndex+pageSize; i++)
    {
      var newsObj = newsArray[i];
      var pages = newsArray.length/pageSize;

      embed.setFooter({text: `Page ${startIndex/pageSize + 1} of ${Math.ceil(pages)}`, iconURL: "https://cdn.discordapp.com/avatars/548165454158495745/222c8d9ccac5d194d8377c5da5b0f95b.png?size=4096"});

      if(newsObj == undefined)
        break;

      embed.addFields
      (
        {name:'\u200b', value: newsObj.title == undefined || newsObj.link == undefined ? "Not Available" : `[${newsObj.title}](${hltvURL}${newsObj.link})`},
        {name:"Date", value: newsObj.date == undefined ? "Not Available" : `${(new Date(newsObj.date)).toUTCString()}`},
        {name:"Country", value: newsObj.country == undefined ? "Not Available" : newsObj.country.name},
        {name:"Comments", value: newsObj.comments == undefined ? "Not Available" : newsObj.comments.toString()},
      )

      if(i != startIndex+(pageSize - 1))
        embed.addField('\u200b', '\u200b');
    }
    return embed;
}

/**
 * Populates botData with servers, channels, users and bot count based on the given guild object
 *
 *
 * @param {Object}   guild     Guild object used to check for all the relevant stats
 * @param {Object}   botData   Global object used to keep track of necessary botData to avoid reuse.
 * @param {boolean}  isJoin    Used to determine whether to add or subtract the stats from the global total
 *
 * @return {Object}            Returns the populated botData object.
 */
var checkStats = (guild, botData, isJoin) =>
{
  if (isJoin)
  {
    botData.servercount += 1;
    botData.channelcount += guild.channels.cache.filter(channel => channel.type != 'category').size;
    //usercount += guild.members.cache.filter(member => !member.user.bot).size;
    botData.usercount += guild.memberCount;
    botData.botcount += guild.members.cache.filter(member => member.user.bot).size;
  }
  else
  {
    botData.servercount -= 1;
    botData.channelcount -= guild.channels.cache.filter(channel => channel.type != 'category').size;
    //usercount += guild.members.cache.filter(member => !member.user.bot).size;
    botData.usercount -= guild.memberCount;
    botData.botcount -= guild.members.cache.filter(member => member.user.bot).size;
  }

  return botData;
}

var postGuildCount = (clientid, count, token) =>
{
  var urlString = `https://discordbots.gg/api/servers?client_id=${clientid}?count=${count}`;
  fetch(urlString, {
    method: 'POST',
    withCredentials: true,
    credentials: 'include',
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => {
    // Handle response
    console.log('Response: ', res);
  })
  .catch(err => {
    // Handle error
    console.log('Error message: ', error);
  });
}

/**
 * Formats a team profile embed based on the given arguments
 *
 * @param {Object}   res     Team profile object to populated the embed with
 * @param {Object}   botData   Global object used to keep track of necessary botData to avoid reuse.
 *
 */
var formatTeamProfileEmbed = (res, botData) =>
{
  var playerRosterOutputStr = '';
  if(res.players != undefined)
  {
    for (var i = 0; i < res.players.length; i++)
    {
      var formattedPlayerName = res.players[i].name.replace(/\s+/g, '-').toLowerCase();
      playerRosterOutputStr += `[${res.players[i].name}](${botData.hltvURL}/stats/players/${res.players[i].id}/${formattedPlayerName}): ${res.players[i].type} (${res.players[i].timeOnTeam})`
      if(i != res.players.length - 1)
      playerRosterOutputStr += '\n';
    }
  }
  else
      playerRosterOutputStr += "Error"

  var footerStr = "Sent by HLTVBot - Last Updated ";
  if(res.updated_at != undefined)
    footerStr += getTime(Date.now() - new Date(res.updated_at).getTime()) + " Ago"
  else
    footerStr += "Now"

  var embed = new MessageEmbed()
    .setTitle(res.team_name + " Profile")
    .setColor(0x00AE86)
    .setThumbnail(res.logo)
    //.setImage(res.coverImage)
    .setTimestamp()
    .setFooter({text: footerStr, iconURL: botData.hltvIMG})
    .setURL(`${botData.hltvURL}/team/${res.team_id}/${res.team_name.replace(/\s+/g, '')}`)
    .addField("Location", res.location == undefined ? "Not Available" : res.location)
    if (res.facebook)
      embed.addField("Facebook", res.facebook);
    if (res.twitter)
      embed.addField("Twitter", res.twitter);
    if (res.instagram)
      embed.addField("Instagram", res.instagram);
    embed.addField("Players", playerRosterOutputStr);
    embed.addField("Rank", res.rank.toString());

  // if (res.logo.includes(".svg"))
  // {
  //   nodeHtmlToImage({
  //     html: `<img src='${res.logo}' />`,
  //     quality: 100,
  //     type: 'png',
  //     transparent: true,
  //     puppeteerArgs: {
  //       args: ['--no-sandbox'],
  //     },
  //     encoding: 'buffer',
  //   }).then(imageResult =>
  //   {
  //     var thumbnail = new MessageAttachment(imageResult, 'logo.png')
  //     embed.setThumbnail('attachment://logo.png');

  //     interaction.editReply({ embeds: [embed], files: [thumbnail] });
  //   })
  // }
  // else
      //interaction.editReply({ embeds: [embed] });
      return embed;
}

/**
 * Formats a team stats embed based on the given arguments
 *
 * @param {Object}   res     Team stats object to populated the embed with
 * @param {Object}   botData   Global object used to keep track of necessary botData to avoid reuse.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
 var formatTeamStatsEmbed = (res, botData) =>
 {
    var footerStr = "Sent by HLTVBot - Last Updated ";
    if(res.updated_at != undefined)
      footerStr += getTime(Date.now() - new Date(res.updated_at).getTime()) + " Ago"
    else
      footerStr += "Now"
    const embed = new MessageEmbed()
    .setTitle(res.team_name + " Stats")
    .setColor(0x00AE86)
    .setTimestamp()
    .setFooter({text: footerStr, iconURL: botData.hltvIMG})
    .setURL(`${botData.hltvURL}/stats/teams/${res.team_id}/${res.team_name.replace(/\s+/g, '-').toLowerCase()}`)
    .addFields
    (
        {name: "Maps Played", value: res.mapsPlayed == undefined ? "Not Available" : res.mapsPlayed.toString(), inline: true},
        {name: "Wins", value: res.wins == undefined ? "Not Available" : res.wins.toString(), inline: true},
        {name: "Losses", value: res.losses == undefined ? "Not Available" : res.losses.toString(), inline: true},
        {name: "Kills", value: res.totalKills == undefined ? "Not Available" : res.totalKills.toString(), inline: true},
        {name: "Deaths", value: res.totalDeaths == undefined ? "Not Available" : res.totalDeaths.toString(), inline: true},
        {name: "KD Ratio", value: res.kdRatio == undefined ? "Not Available" : res.kdRatio.toString(), inline: true},
        {name: "Average Kills Per Round", value: res.totalKills == undefined || res.roundsPlayed == undefined ? "Not Available" : (Math.round(res.totalKills / res.roundsPlayed * 100) / 100).toString(), inline: true},
        {name: "Rounds Played", value: res.roundsPlayed == undefined ? "Not Available" : res.roundsPlayed.toString(), inline: true},
        {name: "Overall Win%", value: res.wins == undefined || res.losses == undefined ? "Not Available" : (Math.round(res.wins / (res.losses + res.wins) * 10000) / 100).toString() + "%", inline: true},
    )

    return embed;
 }

/**
 * Formats an error embed based on the given arguments
 *
 * @param {string}   title     Title for the embed
 * @param {string}   message   message for the embed
 * @param {Object}   botData   Global object used to keep track of necessary botData to avoid reuse.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
 var formatErrorEmbed = (title, message, botData) =>
 {
  return new MessageEmbed()
  .setTitle(`${title}`)
  .setColor(0x00AE86)
  .setTimestamp()
  .setFooter({text: "Sent by HLTVBot", iconURL: botData.hltvIMG})
  .setDescription(`${message}.\nPlease try again or visit [hltv.org](${botData.hltvURL})`);
 }

/**
 * Handles the pagification of the team maps embed
 *
 *
 * @param {Object}   response       Either an interaction or a message object to reply to
 * @param {Object[]}   mapArr       An object array containing all the map objects the team has played.
 * @param {string}      teamID         The ID of the team that this command was called for.
 * @param {string}   teamName       The name of the team that this command was called for.
 * @param {Object}   botData   Global object used to keep track of necessary botData to avoid reuse.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
 var handleTeamMaps = (response, mapArr, teamID, teamName, botData) =>
 {
  var currIndex = 0;
  //console.log(mapArr);
  //var mapArr = func.teamMapsHLTVtoDB(res.mapStats, res.id, res.name);

  var embed = formatMapPageEmbed(currIndex, teamName, teamID, mapArr);

  var originalMember = response.user;
  response.editReply({ embeds: [embed], ephemeral: false, components: [botData.interactionRow] });

  const filter = (user) =>
  {
    user.deferUpdate();
    return user.member.id === originalMember.id;
  }
  const collector = response.channel.createMessageComponentCollector({filter, componentType: 'BUTTON', time: 60000});

  collector.on('collect', (button) =>
  {
    try
    {
      switch (button.customId)
      {
        case botData.reactionControls.PREV_PAGE:
        {
          if (currIndex - 3 >= 0)
            currIndex-=3;
            response.editReply({embeds: [formatMapPageEmbed(currIndex, teamName, teamID, mapArr)]});
          break;
        }
        case botData.reactionControls.NEXT_PAGE:
        {
          if (currIndex + 3 <= mapArr.length - 1)
            currIndex+=3;
            response.editReply({embeds: [formatMapPageEmbed(currIndex, teamName, teamID, mapArr)]});
          break;
        }
        case botData.reactionControls.STOP:
        {
          // stop listening for reactions
          collector.stop();
          break;
        }
      }
    }
    catch(err)
    {
      if (err)
          console.log(err);

      response.editReply({ embeds: [formatErrorEmbed("Error Occurred - Error Code:TM3", "An error occurred during button interaction", botData)] });
    }
  });

  collector.on('end', async () =>
  {
    response.deleteReply().catch(err =>
      {
          if (err.code !== 10008)
              console.log(err);
      });
  });
}

/**
 * Formats a player profile embed based on the given arguments
 *
 *
 * @param {Object}   res       Team profile object to populated the embed with
 * @param {Object}   botData   Global object used to keep track of necessary botData to avoid reuse.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
var formatPlayerEmbed = (res, botData) =>
{
  var footerStr = "Sent by HLTVBot - Last Updated ";
  if(res.updated_at != undefined)
    footerStr += getTime(Date.now() - new Date(res.updated_at).getTime()) + " Ago"
  else
    footerStr += "Now"

  var embed = new MessageEmbed()
    .setTitle(res.ign + " Player Profile")
    .setColor(0x00AE86)
    .setThumbnail(res.image)
    //.setImage(res.image)
    .setTimestamp()
    .setFooter({text: footerStr, iconURL: botData.hltvIMG})
    .setURL(`${botData.hltvURL}/team/${res.team_id}/${res.ign.replace(/\s+/g, '')}`)
    .addFields
    (
        {name: "Name", value: res.name == undefined ? "Not Available" : res.name},
        {name: "IGN", value:  res.ign == undefined ? "Not Available" : res.ign},
        {name: "Age", value:  res.age == undefined ? "Not Available" : res.age.toString()},
        {name: "Country", value:  res.country == undefined ? "Not Available" : res.country},
    )
    if (res.twitch)
      embed.addField("Twitch", res.twitch);
    if (res.facebook)
      embed.addField("Facebook", res.facebook);
    if (res.twitter)
      embed.addField("Twitter", res.twitter);
    if (res.instagram)
      embed.addField("Instagram", res.instagram);
    embed.addField("Team", `[${res.team_name}](${botData.hltvURL}/team/${res.team_id}/${res.team_name.replace(/\s+/g, '')})`)
    if (res.rating)
      embed.addField("Rating", res.rating.toString());
    return embed;
}

/**
 * Converts a given input from a hltv api call into a database readable format
 *
 *
 * @param {Object}   res       Result object from the hltv api call
 *
 * @return {Object}      Database readable format of the given object
 */
var teamStatsHLTVtoDB = (res) =>
{
  var returnObj = Object.assign({}, res.overview);
  returnObj.team_id = res.id;
  returnObj.team_name = res.name;
  return returnObj;
}

/**
 * Converts a given input from a hltv api call into a database readable format
 *
 *
 * @param {Object}   res       Result object from the hltv api call
 *
 * @return {Object}      Database readable format of the given object
 */
var teamProfilesHLTVtoDB = (res) =>
{
  return {
    team_id: res.id,
    team_name: res.name,
    logo: res.logo,
    location: res.country.name,
    facebook: res.facebook,
    twitter: res.twitter,
    instagram: res.instagram,
    rank: res.rank,
    players: res.players
  }
}

/**
 * Converts a given input from a hltv api call into a database readable format
 *
 *
 * @param {Object}   res       Result object from the hltv api call
 * @param {string}   teamID       team ID for the team the maps are for
 * @param {string}   teamName       team name for the team the maps are for
 *
 * @return {Object}      Database readable format of the given object
 */
var teamMapsHLTVtoDB = (inputArr, teamID, teamName) =>
 {
  var mapArr = [];

  for (var mapKey in inputArr)
  {
    var map = inputArr[mapKey];
    mapArr.push(map);
    map.map_name = mapKey;
    map.team_id = teamID;
    map.team_name = teamName;
  }
  return mapArr;
 }

 /**
 * Converts a given input from a hltv api call into a database readable format
 *
 *
 * @param {Object}   res       Result object from the hltv api call
 *
 * @return {Object}      Database readable format of the given object
 */
var playersHLTVtoDB = (res) =>
{
  return {
    id: res.id,
    name: res.name,
    ign: res.ign,
    image: res.image,
    age: res.age,
    twitter: res.twitter,
    twitch: res.twitch,
    facebook: res.facebook,
    instagram: res.instagram,
    country: res.country != null ? res.country.name : undefined,
    team_id: res.team.id,
    team_name: res.team.name,
    rating: res.statistics != null ? res.statistics.rating : undefined
  }
}

module.exports = {handleEventPages, formatMapPageEmbed, handleNewsPages, handlePages, reverseMapFromMap, getTime, checkStats, postGuildCount, formatTeamProfileEmbed, formatTeamStatsEmbed, handleTeamMaps, formatPlayerEmbed, formatErrorEmbed, teamProfilesHLTVtoDB, teamMapsHLTVtoDB, teamStatsHLTVtoDB, playersHLTVtoDB};