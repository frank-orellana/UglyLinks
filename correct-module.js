var fs = require('fs')



fixVueModuleForES6("./extension/js/popup.js");
fixVueModuleForES6("./extension/js/options.js");


function fixVueModuleForES6(path){
  fs.readFile(path, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var result = data.replace(/import +Vue +from +['"]vue['"] *;/i, '');
  
    fs.writeFile(path, result, 'utf8', function (err) {
       if (err) return console.log(err);
       return console.log('fixed vue import in '+ path);
    });
  });
}
