var express = require('express');
var mysql = require('mysql');
var path = require('path');
var exphbs = require('express-handlebars');
var generateId = require('./generateid');

// Set up mysql

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : 'isitopen'
});

connection.connect(function (err) {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }

  console.log('Connected as id ' + connection.threadId);
});

// Set up express

var app = express();

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use('/public', express.static('public'));

var pixel = new Buffer([
  0x47,0x49, 0x46,0x38, 0x39,0x61, 0x01,0x00, 0x01,0x00, 0x80,0x00, 0x00,0xFF, 0xFF,0xFF,
  0x00,0x00, 0x00,0x21, 0xf9,0x04, 0x04,0x00, 0x00,0x00, 0x00,0x2c, 0x00,0x00, 0x00,0x00,
  0x01,0x00, 0x01,0x00, 0x00,0x02, 0x02,0x44, 0x01,0x00, 0x3b
]);

app.get('/beacon/:id.gif', function (req, res) {
    // Save request to database

    connection.query('INSERT IGNORE INTO beacon_view SET ?', {
        id: req.params.id,
        viewed_at: new Date(),
        request_data: JSON.stringify({
            headers: req.headers,
            ip: req.ip
        })
    }, function (error, results, fields) { if (error) throw error; });

    // Respond with 1x1 transparent gif

    res.set({
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
    });

    res.send(pixel);
    res.end(pixel)
});

app.get('/check/:id', function(req, res) {
    // Look up beacon in the database
    let beaconInfo;

    connection.query('SELECT * FROM beacon_view WHERE id = ?', req.params.id, function (err, results, fields) {
        if(results.length) {
            beaconInfo = results[0];          
        }

        res.render('check', {
            id: req.params.id,
            isOpen: !!beaconInfo,
            dateOpened: beaconInfo && beaconInfo.viewed_at,
            requestData: beaconInfo && JSON.stringify(JSON.parse(beaconInfo.request_data.toString('utf8')), null, 2)
        });
    });
});

app.use('/', function (req, res) {
    res.render('index', { id: generateId() });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000');
});