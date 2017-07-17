var path = require('path');
var appDir = path.dirname(require.main.filename);
var thoughtCore = require(appDir + '/async_models/thoughtCore');
var config = require(appDir + '/config');

var mongoose = require('mongoose');
var async = require('async');

mongoose.Promise = global.Promise
mongoose.connect(config.database);
mongoose.connection.on('error', function() {
  console.info('Error: Could not connect to MongoDB. Did you forget to run `mongod`?'.red);
});

module.exports = function(cb){
  async.series([
    function(seriesCB){
      thoughtCore.removeThought("I really like eating hamburger pies when I'm at work.", function(err, thoughtObj){
        //console.log("Test thought object: " + thoughtObj);
        if (err){
          console.log("Thought removal errors: " + err);
          seriesCB(err);
        }
        else
        {
          console.log("-----------------------------\nAttempted object deletion had no errors");
          seriesCB(null, thoughtObj);
        }
      });
    },
    function(seriesCB){
      thoughtCore.createThought("I really like eating hamburger pies when I'm at work.", function(err, thoughtObj){
        //console.log("Test thought object: " + thoughtObj);
        if (err){
          console.log("New thought creation errors: " + err);
          seriesCB(err);
        }
        else
        {
          console.log("-----------------------------\nSuccessful new thought creation");
          seriesCB(null, thoughtObj);
        }
      });
    },
    function(seriesCB){
      thoughtCore.createThought("I really like eating hamburger pies when I'm at work.", function(err, thoughtObj){
        //console.log("Test thought object: " + thoughtObj);
        if (err){
          console.log("Old thought creation errors: " + err);
          seriesCB(err);
        }
        else
        {
          console.log("-----------------------------\nSuccessful old thought creation");
          seriesCB(null, thoughtObj);
        }
      });
    }
  ],cb);
};
