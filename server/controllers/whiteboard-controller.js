const path = require('path');
module.exports = function(app){
  app.get('/whiteboard-viewer', (req, res) => {
    console.log("somebody went to the whiteboard route.");
    res.sendFile(path.join( global.__base, 'client/html' ,'whiteboard-viewer.html') )
    // res.json("Goodbye Kelton.");
  });
  app.get('/whiteboard-editor', (req, res) => {
    console.log("somebody went to the whiteboard route.");
    res.sendFile(path.join( global.__base, 'client/html' ,'whiteboard-editor.html') )
    // res.json("Goodbye Kelton.");
  });
};
