var PythonShell = require('python-shell');
var path = require('path');
var appDir = path.dirname(require.main.filename);

// Interfaces with python scripts for nlp dependency/NER processing
module.exports = function (queryString, debugging, cb){
  var pyshell = new PythonShell('pyNodeReceptor.py', { scriptPath: appDir + '/parsingSystems/' } );
  pyshell.send(queryString);
  i =  0;
  pyshell.on('message', function (message) {
    if ((i == 1)){
      cb(null, message);
    }
    i += 1;
  });
  pyshell.end(function (err) {
    if (err){ 
      cb(err);
    } 
  });
}