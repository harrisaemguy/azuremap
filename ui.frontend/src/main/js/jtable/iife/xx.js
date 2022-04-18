// define an anonymous function, and invokes it immediately with parameter 111
(function (inFn) {
  console.log('111: ' + inFn);
})(111);

//IIFE first fn, and use another fn as parameter
(function (x) {
  console.log('invoke x()');
  x();
})(function (y) {
  console.log('exe anonymous()');
});
