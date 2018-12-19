const request = require('request');
const conf = require('./config');

function cleanLocationJSON(locationJSON) {
    var candids = locationJSON.candidates;
    var arrayLength = candids.length;
    var cleanedLocs = [];
    for (var i = 0; i < arrayLength; i++) {
        var locationDetails = candids[i];
        cleanedLocs.push({
            name: locationDetails.formatted_address,
            lat: locationDetails.geometry.location.lat,
            long: locationDetails.geometry.location.lng,
        })
    }
    return cleanedLocs;
}


function fetch_location(location_string, session, results, next, callback) {

    var URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=" + conf.get_map_key() + "&fields=formatted_address,geometry,name&inputtype=textquery&input="+location_string; 

    request.get(URL,function (err, res, body) {
        if (err) {
            console.log(err);
            return [];
        }

        console.log(cleanLocationJSON(JSON.parse(body)));
        callback(session,results,next,cleanLocationJSON(JSON.parse(body)));
    });
}

module.exports = {
    get_location: fetch_location
};