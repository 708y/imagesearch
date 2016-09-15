var express = require('express')
var https = require('https');
var mongo = require('mongodb').MongoClient
var app = express();

var url = process.env.MONGOLAB_URI;
var collectionArg = "imagesearch";

mongo.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', url);

    var collection = db.collection(collectionArg);

    app.get('/api/latest/imagesearch', function(req, res){
        collection.find().limit(10).sort({$natural:-1}).toArray(function(err, json){
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(json));       
        });
    });
    
    app.get('/api/imagesearch/*', function(req, res){
            var offset = 1;
            if (req.query.offset != undefined && req.query.offset != 0){
                offset = req.query.offset;
            }
            var url = "https://www.googleapis.com/customsearch/v1?q="+req.params[0]+"&num=10&start="+offset+"&imgSize=medium&searchType=image&cx=015640471534236193269%3A--vh06opjms&key=AIzaSyDg6IpGXhvhedJXva6mxIdodQOvBF6N9nY";
            
            collection.insert({'term': req.params[0], 'when': new Date().toISOString()}, function(err, data) {
                if (err) throw err;
            });
            
            https.get(url, function(res2){
                var body = '';
    
                res2.on('data', function(chunk){
                    body += chunk;
                });
            
                res2.on('end', function(){
                    var response = JSON.parse(body);
                    var items = response.items;
                    
                    if (items == undefined){
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify(response));        
                    }else{
                        var json = [];
                        items.forEach(function(item) {
                            json.push({url: item.link, snippet: item.snippet, thumbnail: item.image.thumbnailLink, context: item.image.contextLink});
                        });
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify(json));    
                    }
                });
            });
    });
  }
});

app.listen(process.env.PORT || 8080, function () {
  console.log('Example app listening on port 8080!');
});