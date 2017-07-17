var path = require('path');
var appDir = path.dirname(require.main.filename);
var ThoughtMod = require(appDir + '/db_models/Thought');
var ThoughtLinkObjectMod = require(appDir + '/db_models/ThoughtLinkObject');
var ThoughtLinkMod = require(appDir + '/db_models/ThoughtLink');
var Thought = require(appDir + '/memory/Thought');

var async = require('async');

module.exports.createThought = function(query, cb){
  console.log("\n\n-----------------------------\nThinking:");
  console.log("Creating thought");
  ThoughtMod.findOne({query: query.trim()}).populate('centralLinks').populate('suppLinks').exec(function(err, existingThought){
    if (err){
      console.log("Error finding thought");
      cb(err);
    } else if (existingThought){
      console.log("Old thought");
      var generatedThought = new Thought(existingThought.query, existingThought);
      generatedThought.loadFromModel(function(err){
        cb(err, generatedThought)
      });
    } else {
      if (err){
        cb(err);
      } else {
        console.log("New thought: " + query);
        var generatedThought = new Thought(query);
        generatedThought.initiate(function(err){
          console.log("Thought initiated: " + err);
          if (err){
            cb(err);
          } else {
            generatedThought.saveToDatabase(cb);
          }
        });
      }
    }
  });
}

module.exports.removeThought = function(query, cb){
  console.log("-----------------------------\nDumbing down:");
  console.log("Removing thought");
  ThoughtMod.findOne({query: query.trim()}).populate('centralLinks').populate('suppLinks').exec(function(err, existingThought){
    if (err){
      console.log("Error finding thought");
      cb(err);
    } else if (existingThought){
      async.series(
        [
          function(cb){
            async.forEachOf(existingThought.links, function(link, key, eachCB){
              async.series([
                  function(innerSeriesCB){
                    ThoughtLinkObjectMod.findOneAndRemove({_id: link.object}, innerSeriesCB);
                  },
                  function(innerSeriesCB){
                    ThoughtLinkObjectMod.findOneAndRemove({_id: link.subject}, innerSeriesCB);
                  },
                  function(innerSeriesCB){
                    ThoughtLinkMod.findOneAndRemove({_id: link._id}, innerSeriesCB);
                  }
              ],eachCB);
            }, cb);
          },
          function(cb){
            ThoughtMod.findOneAndRemove({_id: existingThought._id}, cb);
          }
        ],
        function(err){
          cb(err, true);
        }
      );
    } else {
      cb(null, false)
    }
  });
}

