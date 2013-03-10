"use strict";

//First, a hack to get around a current Webkit bug:
//https://bugs.webkit.org/show_bug.cgi?id=105257
document.getElementById("svg-use-order-hack").innerHTML =
  '<svg height="16px" width="16px">' +
    '<use id="favicon-use" xlink:href="#logo"></use></svg>';

// Everything from this point down is to do with color picking

//What parts get colored.
var parts = ["figure","iris","ground"];

//The array that will hold the pickers once constructed.
var pickers = [];

//The colors of the corresponding parts, stored outside of the element fill
//for easy array manipulation.
var colors = parts.map(function(id){
  return document.getElementById(id).getAttribute("fill");
});
var defaultColors = colors.slice(0);

//Semaphore that we're adjusting the location, so that we don't fall into an
//endless loop of reacting to our own updates
var changingLocation = false;

function changeLocation(){
  //Set the semaphore so this change won't be read
  changingLocation = true;

  //Set the URL fragment (location.hash) to the one we just constructed.
  location.hash = '#!'+colors.map(function(color){
    //Assuming the color is in hash-prefixed hex format,
    //remove the hash sign from the color
    return color.substr(1);
  }).join('');
}

function describeTitle() {
  var ntc = window.ntc || null;

  //If Name That Color is loaded
  if(ntc){
    //Set the window title
    document.title = 'Mindsight Apps Logo: ' + colors.map(function(color){
      //Map the named colors
      return ntc.name(color)[1];
    }).join(' on ');
  }
}

// Update the URL + title to reflect the current colors of the logo
function commitColors(){
  changeLocation();
  describeTitle();
}

// Make a color picker form.
function makePicker(i){
  var id = parts[i];

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

      //Stash that color in the local array
      colors[i] = hex;

      //Position the UI indicators
      ColorPicker.positionIndicators(sliderInd,pickerInd,mouseSlide, mousePicker,'%');
    },

    //When the color of this part is committed (mouseup)
    function(hex, hsv, rgb, mousePicker, mouseSlide){

      //Update the URL to reflect the new color
      commitColors();
    });

  //Store this picker so it can be updated when the color is set via URL
  pickers[i] = cp;
}

//Make all the color pickers.
for (var i=0;i<parts.length;i++){
  makePicker(i);
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
          pickers[i].setHex(color);
        }
      }
    //If the URL has no hash component, or it has some meaningless
    //non-hashbang value
    } else {

      //Set the logo to its initial state
      for (var i=0;i<parts.length;i++){

        //Assume the color is in hex format
        pickers[i].setHex(defaultColors[i]);
      }

      // Adding a hashbang here is a bad idea. It means that, if you back up
      // your history to a point where the page had no hash component,
      // it'll functionally navigate to a "new" state, replacing *everything*
      // forward of it in history (everything you backed up to).
      // Better to just set the default colors (so it does work as a state
      // that you can back up to on its own).
    }

    //Either way, set the window color to describe the current colors
    describeTitle();
  }
}

//Parse/set the initial load hash value
updateFromHash();
//Set a listener so we update the logo every time the URL hash changes
//(like when the user presses the Back button)
window.onhashchange = updateFromHash;
