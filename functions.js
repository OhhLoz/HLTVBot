const { MessageEmbed, MessageAttachment } = require('discord.js');
const COMMANDCODE = require("./commandcodes.json");
const mapDictionary = require("./maps.json");
const mapURLDictionary = require("./mapimages.json");
const formatDictionary = require("./formats.json");
const hltvURL = "https://www.hltv.org";
const { request } = require('undici');
const Canvas = require('@napi-rs/canvas');
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

    if(code == COMMANDCODE.MATCHES)
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
          if (currMap == undefined)
            mapStr += "Not Selected / Unknown";
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
          mapStr += "Not Selected / Unknown";
        else
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
          if (currMap == undefined)
            mapStr += "Not Selected / Unknown";
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
          mapStr += "Not Selected / Unknown";
        else
          mapStr += currMap;
      }
    }
    else
        mapStr += "Not Selected / Unknown";

    embed.addField("Map", `${mapStr}`, false);


    if (code == COMMANDCODE.MATCHES || COMMANDCODE.LIVEMATCHES)
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
 * @param {Object}   res            Object containing the data to be formatted into pages.
 * @param {int}      startIndex     Which index within the Object to start populating the pages with.
 * @param {string}   teamName       The name of the team that this command was called for.
 * @param {int}      teamID         The ID of the team that this command was called for.
 * @param {string[]}   mapArr       A string array containing all the map codes the team has played.
 * @param {string[]}   mapNameArr   A string array containing all the map names the team has played.
 *
 * @return {MessageEmbed}      Returns the formatted embed so it can be edited further or sent to the desired channel.
 */
var handleMapPages = (res, startIndex, teamName, teamID, mapArr, mapNameArr) =>
{
  var pageSize = 3;
  var embed = new MessageEmbed()
      .setColor(0x00AE86)
      .setTimestamp()
      .setTitle(teamName + " Maps")
      .setURL(`${hltvURL}/stats/teams/${teamID}/${teamName}`);

  var teamMapContentHTML = ""

  for (var i = startIndex; i < startIndex+pageSize; i++)
  {
    var map = mapArr[i];
    //console.log(map);
    var mapName = mapDictionary[mapNameArr[i]];
    //console.log(mapName);
    var pages = mapArr.length/pageSize;

    // if(map == null) //Error with live matches, assumes will have enough to fill 1 page so less than that throws an error
    //   return embed;

    var mapURL = mapURLDictionary[mapNameArr[i]]

    embed.setFooter({text: `Page ${startIndex/pageSize + 1} of ${Math.ceil(pages)}`, iconURL: "https://cdn.discordapp.com/avatars/548165454158495745/222c8d9ccac5d194d8377c5da5b0f95b.png?size=4096"});

    if (mapName == undefined)
        mapName = "Other";

    if (map != null)
      teamMapContentHTML += formatTeamMapsHTML(mapName, map, mapURL);

    if(i != startIndex+(pageSize - 1))
      teamMapContentHTML += '<hr id="seperator">'
  }

    var teamMapFullHTML = formatTeamMapFullHTML(teamMapContentHTML);
    return teamMapFullHTML;
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
        {name:"End", value: matchEndDate.toUTCString()},
        {name:"Prize Pool", value: event.prizePool == undefined ? "Not Available" : event.prizePool},
        {name:"Number of Teams", value: event.numberOfTeams == undefined ? "Not Available" : event.numberOfTeams.toString()},
        {name:"Location", value: event.location == undefined ? "Not Available" : event.location.name},
      )

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

/**
 * Formats a team profile embed based on the given arguments
 *
 *
 * @param {Object}   res     Team profile object to populated the embed with
 * @param {Object}   botData   Global object used to keep track of necessary botData to avoid reuse.
 *
 * @return {MessageEmbed}            Returns the populated team profile embed object.
 */
var handleTeamProfile = (interaction, res, botData) =>
{
  var playerRosterOutputStr = '';
  for (var i = 0; i < res.players.length; i++)
  {
      playerRosterOutputStr += `[${res.players[i].name}](${botData.hltvURL}/stats/players/${res.players[i].id}/${res.players[i].name}): ${res.players[i].type} (${res.players[i].timeOnTeam})`
      if(i != res.players.length - 1)
      playerRosterOutputStr += '\n';
  }

  var embed = new MessageEmbed()
    .setTitle(res.name + " Profile")
    .setColor(0x00AE86)
    .setThumbnail(res.logo)
    //.setImage(res.coverImage)
    .setTimestamp()
    .setFooter({text: "Sent by HLTVBot", iconURL: "https://cdn.discordapp.com/avatars/548165454158495745/222c8d9ccac5d194d8377c5da5b0f95b.png?size=4096"})
    .setURL(`${botData.hltvURL}/team/${res.id}/${res.name.replace(/\s+/g, '')}`)
    .addField("Location", res.country.name == undefined ? "Not Available" : res.country.name)
    if (res.facebook)
      embed.addField("Facebook", res.facebook);
    if (res.twitter)
      embed.addField("Twitter", res.twitter);
    if (res.instagram)
      embed.addField("Instagram", res.instagram);
    embed.addField("Players", playerRosterOutputStr);
    embed.addField("Rank", res.rank.toString());


  if (res.logo.includes(".svg"))
  {
    request(res.logo).then(imageResult =>
    {
      imageResult.body.arrayBuffer().then(result =>
      {
        const canvas = Canvas.createCanvas(100, 100);
        const context = canvas.getContext('2d');
        const avatar = new Canvas.Image();
        avatar.src = Buffer.from(result)
        context.drawImage(avatar, 0, 0, 100, 100);
        var thumbnail = new MessageAttachment(canvas.toBuffer(result), 'logo.png');
        embed.setThumbnail('attachment://logo.png');
        interaction.editReply({ embeds: [embed], files: [thumbnail] });
      })
    })
  }
  else
      interaction.editReply({ embeds: [embed] });

}

var formatTeamMapsHTML = (mapName, map, mapURL) =>
{
  return `<div class="map-container">
      <div class="flex-item-left">
        <div class = "flex-container">
          <div id="maptitle">
            <h4 id="title">${mapName}</h4>
          </div>
          <div id="roundsplayed">
            <h5 id="rounds">${map.totalRounds == undefined ? "Not Available" : map.totalRounds.toString() + " Rounds"}</h5>
          </div>
        </div>
        <hr>
        <div class="flex-container">
          <div class="flex-item">
            <h5 id="wintitle">W</h5>
            <h5>${map.wins == undefined ? "Not Available" : map.wins.toString()}</h5>
          </div>
          <div class="flex-item">
            <h5>D</h5>
            <h5>${map.draws == undefined ? "Not Available" : map.draws.toString()}</h5>
          </div>
          <div class="flex-item">
            <h5 id="losstitle">L</h5>
            <h5>${map.losses == undefined ? "Not Available" : map.losses.toString()}</h5>
          </div>
          <div class="flex-item">
            <h5>Win %</h5>
            <h5>${map.winRate == undefined ? "Not Available" : map.winRate.toString()}</h5>
          </div>
        </div>
      </div>
      <div class="flex-item-right">
        <img src='${mapURL}' />
      </div>
  </div>`
}

var formatTeamMapFullHTML = (data) =>
{
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      <style>
        body {
          font-family: 'Courier New', monospace;
          color: #fff;
          max-width: 500px;
          border-top: 3px solid rgb(16, 180, 209);
        }

        .map-container {
          max-width: 500px;
          display: flex;
          flex-direction: row;
          background: rgb(31, 31, 31);
          align-items: flex-start;
        }

        .flex-container {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
        }

        .flex-item-left {
          margin-left: 10px;
          flex: 70%;
          text-anchor: start;
          line-height:0px;
        }

        .flex-item-left hr {
          margin-left: 5px;
          margin-right: 5px;
        }

        #maptitle h4 {
          margin-left: 10px;
          margin-bottom: 10px;
        }

        #roundsplayed h5 {
          text-align: end;
          margin-right: 10px;
          margin-bottom: 10px;
        }

        .flex-item-right {
          padding: 10px;
          flex: 30%;
        }

        #maptitle {
          flex: 60%
        }

        #roundsplayed {
          flex: 40%
        }

        img {
          width: 150px;
          height: 100px;
          border: 1px solid #fff;
          padding: 5px;
        }

        #wintitle {
          color: chartreuse;
        }

        #losstitle {
          color: rgb(255, 0, 0);
        }

        .flex-item {
          flex: 70%;
          line-height:0px;
          text-align: center;
        }

        .wrapper {
          background: rgb(31, 31, 31);
          padding-top: 5px;
        }

        #seperator {
          border: 1px solid dodgerblue;
          margin-left: 10px;
          margin-right: 10px;
          margin-top: 0px;
          margin-bottom: 5px;
        }

      </style>
    </head>
    <body>
      <div class="wrapper">
        ${data}
    </div>
    </body>
  </html>`
}

module.exports = {handleEventPages, handleMapPages, handleNewsPages, handlePages, reverseMapFromMap, getTime, checkStats, handleTeamProfile, formatTeamMapsHTML, formatTeamMapFullHTML}