/*global setupSVGPan*/

"use strict";
var count = 0;
var twopi = Math.PI * 2;

function addCircle(x,y) {
  var circle = document.createElementNS("http://www.w3.org/2000/svg",'circle');
  var text = document.createElementNS("http://www.w3.org/2000/svg",'text');
  var g = document.createElementNS("http://www.w3.org/2000/svg",'g');

  circle.setAttribute('class','none');
  circle.setAttribute('r','.35in');
  circle.setAttribute('cx',0);
  circle.setAttribute('cy',0);

  text.setAttribute('x',0);
  text.setAttribute('y',0.075+'in');

  g.setAttribute('data-draggable','');
  g.setAttribute('transform','translate('+x+' '+y+')');

  g.appendChild(circle);
  g.appendChild(text);

  document.getElementById('viewport').appendChild(g);
  ++count;
  return {g:g, circle: circle, text: text};
}

function addSetupLine () {
  //determine location
  var ring = (Math.floor(count/6)+1);
  var distance = (Math.sqrt(ring))*(Math.sqrt(2));
  var angle = twopi/3 * (count%3);
  if (count%6 >= 3) angle += twopi/6;
  if (ring%2) angle += twopi/12;

  var x = 5+distance*Math.cos(angle);
  var y = 4+distance*Math.sin(angle);

  var cg = addCircle(x,y);

  var radopts = ["mgr","ffr","exile","none"];
  var labels = {
    mgr: "Manager",
    ffr: "Firefighter",
    exile: "Exile",
    none: "Unassigned"
  };

  var line = document.createElement('div');
  line.className = "setupline";

  var selected = 'none';

  var namer = document.createElement('input');
  namer.oninput = function(e){
    cg.text.textContent = namer.value;
  };
  namer.onkeypress = function(e){
    if (e.keyCode==13) {
      addSetupLine();
    }
  };
  line.appendChild(namer);

  var resets = [];
  function resetButtons(){
    resets.forEach(function(f){f()});
  }
  function makeButton(radopt) {
    var button = document.createElement('button');
    button.type="button";
    var baseClass = radopt;
    resets.push(function(){
      if(selected == radopt){
        button.className = baseClass + ' active';
      } else {
        button.className = baseClass;
      }
    });
    button.textContent = labels[radopt];
    button.onclick = function(e){
      selected = radopt;
      cg.circle.setAttribute('class',radopt);
      resetButtons();
    };
    line.appendChild(button);
  }
  radopts.forEach(makeButton);
  resetButtons();
  document.getElementById('lines').appendChild(line);
  namer.focus();
}

function setupPage(){
  setupSVGPan(document.getElementById("printout"),
    document.getElementById("viewport"));
  document.getElementById("partsbox")
    .addEventListener('mousedown', summonCircle, false);
}

function summonCircle(evt){
  //use a function from SVGPan
  var p = getEventPoint(evt);
  //TODO: X and Y need to be transformed by the SVG's current zoom/pan -
  //currently they just put the circle at the Parts box's screen position.
  var c = addCircle(p.x,p.y);
  console.log(c.g);
  //hook into variables in SVGPan
  state = "drag";
  stateTarget = c.g;
}

function togglePanel(){
  var curleft = document.getElementById('sidebar').style.left;
  var offsetLeft = document.getElementById('sidetoggle').offsetLeft;
  if(!curleft){
    document.getElementById('sidebar').style.left = -offsetLeft+'px';
    document.getElementById('toglabel').textContent = 'Show controls';
  } else {
    document.getElementById('sidebar').style.left = null;
    document.getElementById('toglabel').textContent = 'Hide controls';
  }
}