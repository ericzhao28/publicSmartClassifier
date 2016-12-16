var path = require('path');
var appDir = path.dirname(require.main.filename);
var parsingHandler = require(appDir + '/handlers/parsingHandler');

module.exports = function(cb){
  try{
    parsingHandler("This is a test", true, function(err, dataString){
      if (err){
        cb(err);
      } else {
        parsed = JSON.parse(dataString.replace(/'/g, '"'))
        if (parsed.result[0]){
          cb(err, "Parsing system up and running");
        } else {
          cb(err, null);
        }
      }
    });
  } catch (err) {
    cb(err, null);
  }
};
