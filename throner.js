/*global setupSVGPan*/

"use strict";
var count = 0;
var twopi = Math.PI * 2;

function addCircle() {
  var circle = document.createElementNS("http://www.w3.org/2000/svg",'circle');
  var text = document.createElementNS("http://www.w3.org/2000/svg",'text');
  var g = document.createElementNS("http://www.w3.org/2000/svg",'g');

  //determine location
  var ring = (Math.floor(count/6)+1);
  var distance = (Math.sqrt(ring))*(Math.sqrt(2));
  var angle = twopi/3 * (count%3);
  if (count%6 >= 3) angle += twopi/6;
  if (ring%2) angle += twopi/12;

  var x = 5+distance*Math.cos(angle);
  var y = 4+distance*Math.sin(angle);

  circle.setAttribute('class','none');
  circle.setAttribute('r','.35in');
  circle.setAttribute('cx',x+'in');
  circle.setAttribute('cy',y+'in');

  text.setAttribute('x',x+'in');
  text.setAttribute('y',(y+0.075)+'in');

  g.setAttribute('data-draggable','');

  g.appendChild(circle);
  g.appendChild(text);

  document.getElementById('viewport').appendChild(g);
  ++count;
  return {circle: circle, text: text};
}

function addSetupLine () {
  var cg = addCircle();
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
  addSetupLine();
  setupSVGPan(document.getElementById("printout"),
    document.getElementById("viewport"));
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