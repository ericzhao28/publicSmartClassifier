var PythonShell = require('python-shell');
var path = require('path');
var appDir = path.dirname(require.main.filename);

// Interfaces with python scripts for neural net computation
var pyshell = new PythonShell('handler_interface.py', { scriptPath: appDir + '/learner/' } );

module.exports = function (query, cb){
  pyshell.send(query);
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
