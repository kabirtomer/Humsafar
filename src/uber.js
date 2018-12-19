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

function sendRideRequest(args, session, results, next, callback) {
    var URL = "https://sandbox-api.uber.com/v1.2/requests";
    console.log(args);
    var raw_body = '{ "fare_id": "' + args.fare_id + '", "product_id": "' + args.product_id + '", "start_latitude": ' + args.src_lat + ', "start_longitude": ' + args.src_long + ', "end_latitude": ' + args.dest_lat + ', "end_longitude": ' + args.dest_long + ' }';
    console.log("sendRideRequest Raw body : - "+raw_body)
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
    console.log("sendRideRequest Result : - "+body)

        // console.log(body);
        callback(session, results, next, JSON.parse(body));
    });
}

function clean_estimate(my_json) {
    if (my_json.fare != undefined) {
        if(my_json.trip != undefined){
            return {
                fare: my_json.fare.value + ' ' + my_json.fare.currency_code,
                fare_id: my_json.fare.fare_id,
                distance: my_json.trip.distance_estimate + ' ' + my_json.trip.distance_unit,
                surge: false
            };
        }else{
            return {};
        }
    } else {
        return {};
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

function update_trip_status(request_id, status, session, next, get_body, callback) {
    var URL = 'https://sandbox-api.uber.com/v1.2/sandbox/requests/' + request_id;
    request.put(URL, {
        headers: {
            "Authorization": config.get_token(),
            "Content-Type": "application/json"
        },
        body: '{"status":"' + status + '"}',
    }, function (err, res, body) {
        if (err) {
            console.log(err);
            return [];
        }
        // console.log(body);
        callback(session, next, JSON.parse(get_body));
    })
}

function get_trip_status(session, next, status, callback) {
    var URL = "https://sandbox-api.uber.com/v1.2/requests/current";
    request.get(URL, {
        headers: {
            "Authorization": config.get_token(),
        }
    }, function (err, res, body) {
        if (err) {
            console.log(err);
            return [];
        }
        console.log(body);
        update_trip_status(session.userData.booking.request_id, status, session, next, body, callback);
        // callback(session, next, JSON.parse(body));
    })

    /**
     * Possible States
     * 
     * processing    
     * no_drivers_available  (extra)
     * accepted  
     * arriving 
     * in_progress   
     * driver_canceled  (extra)
     * rider_canceled   (extra)
     * complete
     */
}

module.exports = {
    get_rides: getCars,
    get_fare: get_fare,
    booking: sendRideRequest,
    track: get_trip_status
};