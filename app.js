var get_ticket_list, get_home, 
    express = require('express'),
    NodePie = require('nodepie'),
    app = express.createServer(),
    https = require('https');
app.listen(3000); //Listen for connections on port 3000

get_ticket_list = function (req, res) {

    res.contentType("application/json");
    var _itemsPerPage = 10, options, dataRequest;
    
    options = {
      host: 'issues.jasig.org',
      port: 443,
      path: '/sr/jira.issueviews:searchrequest-comments-rss/temp/SearchRequest.xml?jqlQuery=project+%3D+UP+ORDER+BY+updated+DESC%2C+key+DESC&tempMax=100',
      method: 'GET'
    };
    
    dataRequest = https.request(options, function(dataResponse) {
      console.log("statusCode: ", dataResponse.statusCode);
      console.log("headers: ", dataResponse.headers);
      var rss = "", _pageNum = req.params.page ? req.params.page : 1, _items;
      
      dataResponse.on('data', function(d) {
        rss += d;
      });
      dataResponse.on('end', function () {
          var feed = new NodePie(rss), _response = {};
          feed.init();
          
          if (_pageNum > (feed.getItemQuantity() / _itemsPerPage)) {
              _pageNum = feed.getItemQuantity() / _itemsPerPage;
          }
          else if (_pageNum < 1) {
              _pageNum = 1;
          }
          _response.title = feed.getTitle();
          _response.totalQuantity = feed.getItemQuantity();
          _response.page = _pageNum;
          _response.items = [];
          
          _items = feed.getItems((_pageNum -1)* _itemsPerPage, ((_pageNum -1)* _itemsPerPage) + 10);
          _response.resultQuantity = _items.length;
          
          for (var i=0, iLength = _items.length; i<iLength; i++) {
              _response.items.push({
                  title         : _items[i].getTitle(),
                  link          : _items[i].getPermalink(),
                  author        : _items[i].getAuthor(),
                  description   : _items[i].getDescription()
              });
          }
          
          res.send(_response);
      });
    });
    dataRequest.end();

    dataRequest.on('error', function(e) {
      dataResponse.send({error: e});
    });
};

get_home = function (req, res) {
    var mustache = require('mustache');
    
    var tmpl = {
        compile: function (source, options) {
            if (typeof source == 'string') {
                return function(options) {
                    options.locals = options.locals || {};
                    options.partials = options.partials || {};
                    if (options.body) // for express.js > v1.0
                        locals.body = options.body;
                    return mustache.to_html(
                        source, options.locals, options.partials);
                };
            } else {
                return source;
            }
        },
        render: function (template, options) {
            template = this.compile(template, options);
            return template(options);
        }
    };
    
    app.configure(function() {
        app.use(express.methodOverride());
        // app.use(express.bodyDecoder());
        app.use(app.router);
        app.set("views", __dirname);
        app.set("view options", {layout: false});
        app.register(".html", tmpl);
        app.use(express.errorHandler({
            dumpExceptions:true, 
            showStack:true
        }));
    });
    
    res.render("index.html", {
            locals: {
                message: "Hello World!",
                items: ["one", "two", "three"]
            },
            partials: {
                foo: "<h1>{{message}}</h1>",
                bar: "<ul>{{#items}}<li>{{.}}</li>{{/items}}</ul>"
            }
        });
    
};

app.configure(function(){
    app.use(express.static(__dirname + '/static'));
});
app.get('/list_tickets/:page?', get_ticket_list);
app.get('/', get_home);