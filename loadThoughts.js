var async = require('async');
var path = require('path');
var appDir = path.dirname(require.main.filename);
var thoughtCore = require(appDir + '/memory/thoughtCore');
var categoryThoughts = require(appDir + '/data/thoughtSampleData');
module.exports = function(cb){
  console.log("\n########### Loading in reference thoughts ###########\n\n");
  referenceThoughts = [];
  async.forEachOfLimit(Object.keys(categoryThoughts), 1, function (categoryKey, categoryKeyKeys, forOuterLimitCB){ 
    console.log("Loading in: " + categoryKey);
    async.forEachOfLimit(categoryThoughts[categoryKey], 1, function (value, key, forLimitCB) {
      console.log("Loading in: " + categoryThoughts[categoryKey][key]);
      thoughtCore.createThought(value, function(err, thoughtObj){
        console.log("Thought created, error: " + err);
        referenceThoughts.push({'category': categoryKey,'thought':thoughtObj});
        forLimitCB(err);
      });
    }, function(err){
      forOuterLimitCB(err);
    });
  }, function(err){
    if (err){
      console.log(err);
    }
    console.log("Reference thoughts loading in complete");
    console.log("\n###########################################\n\n");
    cb(err, referenceThoughts);
  });
};
