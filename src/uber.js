const request = require('request');
const config = require('./config');

function parseCars(obj) {
    var arr = obj.products;
    var arrayLength = arr.length;
    var cleanedCars = [];
    for (var i = 0; i < arrayLength; i++) {
        var carDetails = arr[i];
        cleanedCars.push({
            name: carDetails.display_name,
            desc: carDetails.description,
            capacity: carDetails.capacity,
            product_id:carDetails.product_id,
        })
    }
    return cleanedCars;
}

function getCars(srcLat, srcLon, session, next, callback) {
    var URL = "https://api.uber.com/v1.2/products?latitude=" + srcLat + "&longitude=" + srcLon;
    request.get(URL, {
        headers: {
            "Authorization": config.get_token(),
            "Accept-Language": "en_US",
            "Content-Type": "application/json"
        },
    }, function (err, res, body) {
        if (err) {
            console.log(err);
            return [];
        }
        callback(session,next,parseCars(JSON.parse(body)));
    });
}

function sendRideRequest(args, session, next, callback) {
    var URL = "https://sandbox-api.uber.com/v1.2/requests";
    console.log(args);
    var raw_body = '{ "fare_id": "' + args.fare_id + '", "product_id": "' + args.product_id + '", "start_latitude": ' + args.src_lat + ', "start_longitude": ' + args.src_long + ', "end_latitude": ' + args.dest_lat + ', "end_longitude": ' + args.dest_long + ' }';
    request.post(URL, {
        headers: {
            "Authorization": config.get_token(),
            "Content-Type": "application/json"
        },
        body: raw_body,
    }, function (err, res, body) {
        if (err) {
            console.log(err);
            return [];
        }
        // console.log(body);
        callback(session, next, JSON.parse(body));
    });
}

function clean_estimate(my_json) {
    return {
        fare: my_json.fare.value + ' ' + my_json.fare.currency_code,
        fare_id: my_json.fare.fare_id,
        distance: my_json.trip.distance_estimate + ' ' + my_json.trip.distance_unit,
    }
}

function get_fare(args, src_lat, src_long, dest_lat, dest_long, session, next, callback) {
    var URL = "https://api.uber.com/v1.2/requests/estimate";
    var raw_body = '{"product_id": "' + args.product_id + '", "start_latitude":"' + src_lat + '", "start_longitude": "' + src_long + '", "end_latitude":"' + dest_lat + '", "end_longitude": "' + dest_long + '","seat_count": "2"}';
    request.post(URL, {
        headers: {
            "Authorization": config.get_token(),
            "Content-Type": "application/json"
        },
        body: raw_body,
    }, function (err, res, body) {
        if (err) {
            console.log(err);
            callback(session, next, {});
            // return [];
        }
        console.log(body);
        callback(session, next, clean_estimate(JSON.parse(body)));
    });
}

function track(interval, session, callback){
    callback(interval, session, "yes");
}

module.exports = {
    get_rides: getCars,
    get_fare: get_fare,
    booking: sendRideRequest,
    track: track
};