"use strict";

//First, a hack to get around a current Webkit bug:
//https://bugs.webkit.org/show_bug.cgi?id=105257
document.getElementById("svg-use-order-hack").innerHTML =
  '<svg height="16px" width="16px">' +
    '<use id="favicon-use" xlink:href="#logo"></use></svg>';

// Everything from this point down is to do with color picking

//What parts get colored.
var parts = ["figure","iris","ground"];

//The object that will hold the pickers once constructed.
var pickers = {};

//Function to convert a decimal value to a two-character hexadecimal value.
function hexByte(x) {
    return ("0" + parseInt(x,10).toString(16)).slice(-2);
}

//Semaphore that we're adjusting the location, so that we don't fall into an
//endless loop of reacting to our own updates
var changingLocation = false;

// Update the URL to reflect the current colors of the logo
function changeLocation(){

  //Set the semaphore
  changingLocation = true;

  //The fragment we're going to append to the URL.
  var fragment = '#!';

  //For each component of the logo, in order
  for (var i=0;i<parts.length;i++){

    //Get the current color of that component
    var color = document.getElementById(parts[i]).getAttribute("fill");

    //handle browsers that return the fill as an rgb value
    //(Firefox)
    var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgb) {
      color = hexByte(rgb[1]) + hexByte(rgb[2]) + hexByte(rgb[3]);
    } else {
      //if it doesn't match the RGB syntax,
      //assume it's a hash-prefixed hex string
      color = color.substr(1);
    }

    //add the color to the hash
    fragment += color;
  }

  //Set the URL fragment (location.hash) to the one we just constructed.
  location.hash = fragment;
}

// Make a color picker form.
function makePicker(id){

  //Make all the components of this color picker
  var pickerElem = document.createElement('div');
  var sliderElem = document.createElement('div');
  var pickerInd = document.createElement('div');
  var sliderInd = document.createElement('div');
  var pickerWrap = document.createElement('div');
  var sliderWrap = document.createElement('div');
  var container = document.createElement('div');

  //Set those components' classes
  pickerElem.className = "picker graphic";
  sliderElem.className = "slider graphic";
  pickerInd.className = "picker indicator";
  sliderInd.className = "slider indicator";
  pickerWrap.className = "picker wrapper";
  sliderWrap.className = "slider wrapper";
  container.className = "colorform";

  //Hook up the components' hierarchy
  pickerWrap.appendChild(pickerElem);
  sliderWrap.appendChild(sliderElem);
  pickerWrap.appendChild(pickerInd);
  sliderWrap.appendChild(sliderInd);
  container.appendChild(pickerWrap);
  container.appendChild(sliderWrap);

  //Put the color picker in the document
  document.getElementById('sidebar').appendChild(container);

  //Populate the picker elements
  /* global ColorPicker */
  var cp = ColorPicker(sliderElem,pickerElem,

    //When the color of this part is changed (via UI or URL)
    function(hex, hsv, rgb, mousePicker, mouseSlide){

      //Set the logo part's fill
      document.getElementById(id).setAttribute("fill",hex);

      //Position the UI indicators
      ColorPicker.positionIndicators(sliderInd,pickerInd,mouseSlide, mousePicker,'%');
    },

    //When the color of this part is committed (mouseup)
    function(hex, hsv, rgb, mousePicker, mouseSlide){

      //Update the URL to reflect the new color
      changeLocation();
    });

  //Store this picker so it can be updated when the color is set via URL
  pickers[id] = cp;
}

//Make all the color pickers.
for (var i=0;i<parts.length;i++){
  makePicker(parts[i]);
}

// Set the colors of the URL.
function updateFromHash(){

  //If we just set the hash ourselves
  if(changingLocation){

    //Go back to listening for the next situation where the hash changes
    changingLocation = false;

  //If the hash has changed by external forces
  } else {

    //If the URL has a hash component and the second character is '!'
    //(a shebang, so we distinguish from in-page anchoring)
    if (location.hash && location.hash.substr(1,1) == '!'){

      //For each part of the logo
      for (var i=0;i<parts.length;i++){

        //Slice six characters out of the URL corresponding to
        //this part of the logo (the Nth 6 characters)
        var color = '#' + location.hash.substr(2+i*6,6);

        //If these characters are a valid hexadecimal string,
        if (color.match(/^#[0-9A-Fa-f]{6}$/)){

          //Set the color of that part to that hexadecimal color
          pickers[parts[i]].setHex(color);
        }
      }
    //If the URL has no hash component, or it has some meaningless
    //non-hashbang value, which has done whatever job it may have had (eg.
    //navigating to an element on the page) where we no longer care about it
    } else {

      //Set the picker values from what's already on the logo
      //(since they're not getting set from the URL)
      for (var i=0;i<parts.length;i++){
        var color = document.getElementById(parts[i]).getAttribute("fill");

        //handle browsers that return the fill as an rgb value
        //(Firefox)
        var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgb) {
          pickers[parts[i]].setRgb({r:rgb[1],g:rgb[2],b:rgb[3]});
        } else {
          //if it doesn't match the RGB syntax,
          //assume it's a hash-prefixed hex string
          pickers[parts[i]].setHex(color);
        }
      }
    }
  }
}

//Parse/set the initial load hash value
updateFromHash();
//Set a listener so we update the logo every time the URL hash changes
//(like when the user presses the Back button)
window.onhashchange = updateFromHash;
