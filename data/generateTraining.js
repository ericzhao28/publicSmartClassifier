var async = require('async');
var prompt = require('prompt');
var path = require('path');
var appDir = path.dirname(require.main.filename);
var nlpProcessor = require(appDir + '/handlers/parsingHandler');

var baseSentence = {};
var otherSentence = {};
var baseInfo;
var otherInfo;

var fs = require('fs');
var comparisonData = require(appDir + '/data/comparisonLobeTrainingData.json');
var sentenceData = require(appDir + '/data/matchingLobeTrainingData.json');

console.log("###########################\n### Brain lobes trainer ###\n###########################\n")

var newAttempt = function(){
  console.log("\n\n---------------------\n");
  console.log("Analyzing new sentences: ");
  prompt.start();
  prompt.get(['baseSentence', 'otherSentence', 'sentencesEquivalent'], initiate);
}

var initiate = function(err, commandSentences){
  async.series([
    function(outermostSeriesCB){
      addSentenceToData(commandSentences);
      outermostSeriesCB();
    },
    function(outermostSeriesCB){
      nlpProcessor(commandSentences.baseSentence, function(err, dataString){
        baseSentence = JSON.parse(dataString).result;
        outermostSeriesCB(err);
      });
    },
    function(outermostSeriesCB){
      nlpProcessor(commandSentences.otherSentence, function(err, dataString){
        otherSentence = JSON.parse(dataString).result;
        outermostSeriesCB(err);
      });
    },
    function(outermostSeriesCB){
      async.series([
        function(seriesCB){
          var dependencyInfo = [];
          async.forEachOf(baseSentence, function(dependency, key, forEachCB){
            dependencyInfo.push(dependency.object + " -> " + dependency.subject);
            forEachCB();
          }, function(err){
            seriesCB(err, dependencyInfo);
          });
        },
        function(seriesCB){
          var dependencyInfo = [];
          async.forEachOf(otherSentence, function(dependency, key, forEachCB){
            dependencyInfo.push(dependency.object + " -> " + dependency.subject);
            forEachCB();
          }, function(err){
            seriesCB(err, dependencyInfo);
          });
        }
      ],
      function(err, results){
        baseInfo = results[0].join([separator = ', ']);
        otherInfo = results[1].join([separator = ', ']);
        outermostSeriesCB();
      });
    },
    function(outermostSeriesCB){
      console.log("\n\n#########################\nGet new dependency info:\n");
      console.log("Base sentence: " + commandSentences.baseSentence + " | and options: " + baseInfo);
      console.log("Other sentence: " + commandSentences.otherSentence + " | and options: " + otherInfo);
      prompt.start();
      prompt.get(['wantToContinue'], function(err, commander){
        var command = commander;
        async.until(
          function(){
            return (command.wantToContinue == "n");
          },
          function(untilLoopCB){
            async.series([
              function(seriesCB){
                prompt.start();
                prompt.get(['baseObject', 'baseSubject', 'otherObject', 'otherSubject', 'matchScore'], function(err, commander){
                  command = commander;
                  seriesCB();
                });
              },
              function(seriesCB){
                var baseFound = false;
                async.until(
                  function(){
                    return baseFound;
                  },
                  // The fuck?
                  function(untilCB){
                    async.forEachOf(baseSentence, function(dependency, key, forEachCB){
                      if (((dependency.object.toLowerCase().trim() == command.baseObject.toLowerCase().trim()) && (dependency.subject.toLowerCase().trim() == command.baseSubject.toLowerCase().trim())) || ((dependency.subject.toLowerCase().trim() == command.baseObject.toLowerCase().trim()) && (dependency.object.toLowerCase().trim() == command.baseSubject.toLowerCase().trim()))){
                        baseFound = true;
                        untilCB(null, dependency);
                      } else {
                        forEachCB();
                      }
                    }, function(err){
                      console.log("!!!!! No match for base sentence attempt !!!!!");
                      seriesCB("baseAttemptFail");
                    }); 
                  },
                  seriesCB
                );
              },
              function(seriesCB){
                var otherFound = false;
                //console.log("attempting to match other sent.");
                async.until(
                  function(){
                    return otherFound;
                  },
                  function(untilCB){
                    //console.log("new other");
                  // The fuck?
                    async.forEachOf(otherSentence, function(dependency, key, forEachCB){
                      if (((dependency.object.toLowerCase().trim() == command.otherObject.toLowerCase().trim()) && (dependency.subject.toLowerCase().trim() == command.otherSubject.toLowerCase().trim())) || ((dependency.subject.toLowerCase().trim() == command.otherObject.toLowerCase().trim()) && (dependency.object.toLowerCase().trim() == command.otherSubject.toLowerCase().trim()))){
                        otherFound = true;
                        untilCB(null, dependency);
                      } else {
                        forEachCB();
                      }
                    }, function(err){
                      console.log("!!!!! No match for other sentence attempt !!!!!");
                      seriesCB("otherAttemptFail");
                    }); 
                  },
                  seriesCB
                );
              }
            ],
            function(err, results){
              if (!err){
                results[3] = parseInt(command.matchScore);
                results.shift();
                addDependencyToData(results);
              }
              console.log("\n\n#########################\nGet new dependency info:\n");
              console.log("Base sentence: " + commandSentences.baseSentence + " | and options: " + baseInfo);
              console.log("Other sentence: " + commandSentences.otherSentence + " | and options: " + otherInfo);
              prompt.start();
              prompt.get(['wantToContinue'], function(err, commander){
                command = commander;
                untilLoopCB();
              });
            });
          },
          newAttempt
        );
      });
    }
  ],
  function(err, results){
    console.log("Bye :)");   
  });
};

var addDependencyToData = function(results){
  comparisonData.push(results);
  fs.writeFile(appDir + '/data/comparisonLobeTrainingData.json', JSON.stringify(comparisonData,null,2), function (err) {
  });
}

var addSentenceToData = function(commander){
  sentenceData.push([commander.baseSentence, commander.otherSentence, parseInt(commander.sentencesEquivalent)]);
  fs.writeFile(appDir + '/data/matchingLobeTrainingData.json', JSON.stringify(sentenceData,null,2), function (err) {
  });
}

newAttempt();