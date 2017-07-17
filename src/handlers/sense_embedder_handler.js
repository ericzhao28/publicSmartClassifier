var path = require('path');
var appDir = path.dirname(require.main.filename);
var request = require('request');
var config = require(appDir + '/config');

/*

Return error in CB only if critical error
Return false if no word embedding match found in sensevec system

Otherwise:
getWordVector -> error, word embedding array
compareWords -> error, similarity score (sometimes false), embeddings distance
compareSentences -> error, distance

*/

exports.embed_word = function(word, pos, cb){
  request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/vector?query=" + word + "&type=" + pos, function (error, response, body) {
    if ((!response) || (response.statusCode != 200)){
      cb("Error code");
    } else if (body.slice(0, 6) == "\"ERROR"){
      cb("Missing argument");
    } else if (JSON.parse(body.replace(/\\n/g, "")) == false){
      cb(null, false);
    } else if (!error) {
      try{
        cb(null, JSON.parse(body.replace(/\\n/g, "")).substring(1, JSON.parse(body.replace(/\\n/g, "")).length-1).split(',').map(Number));
      } catch (err) {
        cb(err);
      }
    } else {
      cb(error);
    }
  });
}

exports.compare_words = function(word, pos, word2, pos2, cb){
  request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/compare?query=" + word + "&type=" + pos+"&query2="+word2+"&type2="+pos2, function (error, response, comparison) {
    if ((!response)||(response.statusCode != 200)){
      cb("Wrong error code");
    } else if (comparison.slice(0,6) == "\"ERROR"){
      cb("Missing argument");
    } else if (!error) {
      request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/compareDistance?query="+word+"&type="+pos+"&query2="+word2+"&type2="+pos2, function (error, response, distance) {
        if (response.statusCode != 200){
          cb("Wrong error code");
        } else if (distance.slice(0,6) == "\"ERROR"){
          cb("Missing argument");
        } else if (!error) {
          if ((distance == "null\n")||(distance == "false\n")){
            var distance = false;
          }
          if ((comparison == "null\n")||(comparison == "false\n")){
            var comparison = false;
          }
          cb(null, comparison, distance);
        } else {
          cb(error);
        }
      });
    } else {
      cb(error);
    }
  });
}

exports.compare_sentences = function(sentence1, sentence2, cb){
  sentence1 = sentence1.replace(" ", "+");
  sentence2 = sentence2.replace(" ", "+");
  request("http://" + config.senseVecHost + ":" + config.senseVecPort + "/senseVec/sentence?query="+sentence1+"&query2="+sentence2, function (error, response, body) {
    if ((!response)||(response.statusCode != 200)){
      cb("Wrong error code");
    } else if (body.slice(0,6) == "\"ERROR"){
      cb("Missing argument");
    } else if (!error) {
      if (body == '"false"\n'){
        cb(null, false);
      }
      else {
        cb(null, body);
      }
    } else {
      cb(error);
    }
  });
}
