var async = require('async');

module.exports = function(scores, cb){
  console.log("\n########### Scoring the categories ###########\n\n");
  scores.sort(compareValue);
  scoreCategories(scores, function(err, finalScore){
    scores = [];
    console.log("\n###########################################\n\n");
    cb();
  });
};

// Sorts in descending order of centrals
function compareValue(a,b) {
  if (parseFloat(a.matchScore) < parseFloat(b.matchScore)){
    // B comes first
    return 1;
  }
  if (parseFloat(a.matchScore) > parseFloat(b.matchScore)){
    // A comes first
    return -1;
  }
  return 0;
}

function scoreCategories(scores, cb){
  trackerObj = {};
  finalScore = {};
  async.forEachOf(scores, function(value, key, forEachCB){
    if (!(value.category in trackerObj)){
      trackerObj[value.category] = 0;
    } 
    // Currently limits final score tallies for categories to 3. Not sure why.
    if (trackerObj[value.category] < 3){
      trackerObj[value.category] += 1;
      if (!(value.category in finalScore)){
        finalScore[value.category] = 0;
      }
      finalScore[value.category] += parseFloat(value.matchScore);
    }
    forEachCB();
  }, function(err){
    cb(err, finalScore);
  })
}

