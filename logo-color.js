//First, a hack to get around a current Webkit bug:
//https://code.google.com/p/chromium/issues/detail?id=166438
document.getElementById("svg-use-order-hack").innerHTML =
  '<svg height="16px" width="16px">' +
    '<use id="favicon-use" xlink:href="#logo"></use></svg>';

//Color picking
var parts = ["figure","iris","ground"];
var pickers = {};

function hexByte(x) {
    return ("0" + parseInt(x,10).toString(16)).slice(-2);
}

var changingLocation = false;

function changeLocation(){
  changingLocation = true;
  var fragment = '#!';
  for (var i=0;i<parts.length;i++){
    var color = document.getElementById(parts[i]).getAttribute("fill");

    //handle browsers that return the fill as an rgb value
    //(Firefox)
    var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgb) {
      color = hexByte(rgb[1]) + hexByte(rgb[2]) + hexByte(rgb[3]);
    } else {
      //assume it's a hash without even checking, like a chump
      color = color.substr(1);
    }

    //add the color to the hash
    fragment += color;
  }
  location.hash = fragment;
}

function makePicker(id){
  var pickerElem = document.createElement('div')
  pickerElem.className = "picker graphic"
  var sliderElem = document.createElement('div')
  sliderElem.className = "slider graphic"
  var pickerWrap = document.createElement('div')
  pickerWrap.className = "picker wrapper"
  var sliderWrap = document.createElement('div')
  sliderWrap.className = "slider wrapper"
  var pickerInd = document.createElement('div')
  pickerInd.className = "picker indicator"
  var sliderInd = document.createElement('div')
  sliderInd.className = "slider indicator"
  var container = document.createElement('div')
  container.className = "colorform"
  pickerWrap.appendChild(pickerElem)
  sliderWrap.appendChild(sliderElem)
  pickerWrap.appendChild(pickerInd)
  sliderWrap.appendChild(sliderInd)
  container.appendChild(pickerWrap)
  container.appendChild(sliderWrap)
  document.getElementById('sidebar').appendChild(container)
  var cp = ColorPicker(sliderElem,pickerElem,
    function(hex, hsv, rgb, mousePicker, mouseSlide){
      document.getElementById(id).setAttribute("fill",hex);
      ColorPicker.positionIndicators(sliderInd,pickerInd,mouseSlide, mousePicker,'%');
    },
    function(hex, hsv, rgb, mousePicker, mouseSlide){
      changeLocation()
    });
  pickers[id] = cp;
}

for (var i=0;i<parts.length;i++){
  makePicker(parts[i])
}

function updateFromHash(){
  //If we just set the hash ourselves
  if(changingLocation){
    //Go back to listening for the next situation where the hash changes
    changingLocation = false;
  } else {
    if (location.hash && location.hash.substr(1,1) == '!'){
      for (var i=0;i<parts.length;i++){
        var color = '#' + location.hash.substr(2+i*6,6)
        if (color.match(/^#[0-9A-Fa-f]{6}$/)){
          pickers[parts[i]].setHex(color)
        }
      }
    } else {
      //The page is initializing- set the picker values
      for (var i=0;i<parts.length;i++){
        var color = document.getElementById(parts[i]).getAttribute("fill");

        //handle browsers that return the fill as an rgb value
        //(Firefox)
        var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgb) {
          pickers[parts[i]].setRgb({r:rgb[1],g:rgb[2],b:rgb[3]});
        } else {
          //otherwise, assume you got hex back
          //(big assumption, I know)
          pickers[parts[i]].setHex(color)
        }
      }
    }
  }
}

updateFromHash();
window.onhashchange = updateFromHash
