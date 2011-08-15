var get_ticket_list, 
    express = require('express'),
    app = express.createServer(),
    https = require('https');
app.listen(3000); //Listen for connections on port 3000

get_ticket_list = function (req, res) {

    res.contentType("application/json");

    var options = {
      host: 'issues.jasig.org',
      port: 443,
      path: '/sr/jira.issueviews:searchrequest-comments-rss/temp/SearchRequest.xml?jqlQuery=project+%3D+UP+ORDER+BY+updated+DESC%2C+key+DESC&tempMax=1000',
      method: 'GET'
    };
    
    var datareq = https.request(options, function(datares) {
      console.log("statusCode: ", datares.statusCode);
      console.log("headers: ", datares.headers);
      var _responseBody = "";
      
      datares.on('data', function(d) {
        res.write(d);
      });
      datares.on('end', function () {
          res.end();
      });
    });
    datareq.end();

    datareq.on('error', function(e) {
      datares.send({error: e});
    });    
};

app.get('/list_tickets', get_ticket_list);