var teamStatsHLTVtoDB = (res) =>
{
  var returnObj = Object.assign({}, res.overview);
  returnObj.team_id = res.id;
  returnObj.team_name = res.name;
  return returnObj;
}

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

module.exports = {teamProfilesHLTVtoDB, teamStatsHLTVtoDB, teamMapsHLTVtoDB}