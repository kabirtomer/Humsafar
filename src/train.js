const request = require('request');
const cheerio = require('cheerio');

function get_data(pnr_no, session, results, next, callback) {
    var result = [];
    const formData = {
        searchText: pnr_no,
        submitpnr: 'GO'
    };
    request.post(
      {
        url: 'https://www.getpnrstatus.co.in/',
        form: formData
      },
      function (err, httpResponse, body) {
        //console.log(body);
        if (body == undefined) {
            return get_data(pnr_no);
        }
        var t = body;
        t = t.substring(33, t.length - 7);
        $ = cheerio.load(t);
        if($('.mystyle')[1] != undefined){
            var a = $('.mystyle')[1]['children'][1];
        }else{
            callback(session, results, next, []);
        }
        //console.log((a['children']).length);
        if(a != undefined){
            var l = a['children'].length;
            var ret = {};
            ret['Current_Status'] = []
            for (var i=2; i<=l-4; i+=2) {
                t = a['children'][i]['children'][5]['children'][0]['data'];
                //console.log(t.substring(1,));         
                ret['Current_Status'].push(t.substring(1,));            
            }
            callback(session, results, next, ret['Current_Status']);
        }else{
            callback(session, results, next, []);
        }
      }
    );
}
// get_data("8113293567");


function delayparser(delstring) {
    if (delstring.indexOf('-') != -1) {
        delstring = delstring.replace('late', 'early');
        delstring = delstring.replace('-', '');
    }
    t = delstring.split(' ');
    if (t[0]=='0') {
        delstring = 'on time';
    }
    return delstring;
}

function parser(data) {
    var response;
    if (data['table'].length==0) {
        response = 'Train not found for today';
    }
    else {
        var arr = data['table'];
        if (arr[0]['Arrived']=='No') {
            response = 'Train is yet to reach the source ' + arr[0]['Station'] + ' running ' + delayparser(arr[0]['Delay']);
        }
        else {
            var l = arr.length;
            var i;
            for (i=0; i<l;) {
                if (arr[i]['Arrived']=='Yes' && arr[i]['Departed']=='Yes') {
                    i++;
                }
                else {
                    break;
                }
            }
            if (arr[i]['Arrived']=='Yes' && arr[i]['Departed']=='No') {
                if (i<l-1) {
                    response = 'Train is at ' + arr[i]['Station'] + ' running ' + delayparser(arr[i]['Delay']);
                }
                else {
                    response = 'Train has reached the destination ' + arr[i]['Station'] + ' running ' + delayparser(arr[i]['Delay']);   
                }
            }
            else {
                i--;
                response = 'Train has left ' + arr[i]['Station'] + ' running ' + delayparser(arr[i]['Delay']);
            }
        }
    }
    return(response)
}


function get_train(train_no, session, results, next, callback){
    var d = (new Date()).toLocaleDateString();
    var y = d.split('/');
    var date = y[1]+'-'+y[0]+'-'+y[2];
    //console.log(date);
    var result = [];
    const formData = {
        searchtrainboxlive: train_no,
        datlive: date,//'19-12-2018', //get todays
        submitTrainlive: 'GO'
    };
    request.post(
      {
        url: 'https://www.getpnrstatus.co.in/live-train-running-status/',
        form: formData
      },
      function (err, httpResponse, body) {
        //console.log(body);
        //
        if (body == undefined) {
            return get_status(train_no);
        }
        var t = body;
        t = t.substring(33, t.length - 7);
        $ = cheerio.load(t);
        var ans = {};
        ans['table'] = [];
        $('.tblTitle').nextAll().each(
            function pprint() {
                var temp = {};
                temp['Station'] = $(this).children()[0]['children'][0]['data'];
                temp['ArrTime'] = $(this).children()[1]['children'][0]['data'];
                temp['Arrived'] = $(this).children()[2]['children'][0]['data'].substring(1,);
                temp['DepTime'] = $(this).children()[3]['children'][0]['data'];
                temp['Departed'] = $(this).children()[4]['children'][0]['data'].substring(1,);
                temp['Delay'] = $(this).children()[8]['children'][0]['data'];
                ans['table'].push(temp);
            }
        );
        callback(session, results, next, parser(ans));
      }
    );
}

module.exports = {
    pnr_status: get_data,
    run_train: get_train
};