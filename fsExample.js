var fs          = require('fs');
var Promise     = require("bluebird");

//Example 1
// Async way of deleting the file
// fs.unlink('D:/Harsha/software/temp.txt', function (err) {
//   if (err) {
//     throw err;
//   }
//   console.log('successfully deleted D:/Harsha/software/temp.txt');
// });

// Sync way of deleting the file
// fs.unlinkSync('D:/Harsha/software/temp.txt');
// console.log('successfully deleted D:/Harsha/software/temp.txt');

//Example 2
// Async way of reading the file
// console.log("Before Reading the file");
// fs.readFile('D:/Harsha/software/temp.txt', 'utf8', function (err, data) {
//   if (err) {
//     throw err;
//   }
//   console.log(data);
// });
// console.log("After Reading the file");

Promise.promisifyAll(fs);

console.log("Before Reading the file");
fs.readFileAsync('D:/Harsha/software/temp.txt', 'utf8')
  .then(function (data) {
    console.log(data);
  })
  .catch(function (err) {
    console.error("unable to read file:", err);
  });

console.log("After Reading the file");
