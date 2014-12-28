// Comparators:
// Problem: many editorials use numbers but don't often give those numbers context as it would disrupt the flow of reading. Alone these numbers can be rather meaningless but with a comparator can better inform what that number (and hence, the editorial) is trying to explain.

// Aim: to give context through a CTA without disturbing the reading experience.

// Requirements: small, brief and not intrusive. CTAs must require context.
// Eg:

// 1,000 > 2000: 800, 2014: 1,000
// 10 to 20 > 100% increase

// Use: compare a number in vie with one that is hidden through data vis [cols, squares, pie].
// Maybe also extend it adding:
// An image, a short description.

// Comparator example:
// Title: 2014 vote share, %
// X: republicans:10
// Y: democrats:90
// T: pie

// <mark class="comparator_item" data-comparator="
// [Title, X, Y, T]">10%</mark>

"use strict";
var cntx = cntx || {};

cntx.callScript = function(url, callback){
    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

cntx.callScript('http://d3js.org/d3.v3.min.js', function() {

  cntx.init = function(){
    if (cntx.checkSupport()) {
      // add css 
      cntx.addStyles();
      // add live class
      d3.selectAll('.contextualiseJS').attr('class', 'contextualiseJS live');
      // start contextualise
      cntx.addContext(d3.selectAll('.contextualiseJS.live'));
    }
  }

  cntx.checkSupport = function(){
    return !!('createElementNS' in document &&
    document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect)
  }

  cntx.touchDevice = (function(){
    var spec = {};
    spec.ami = function() {
      try {
        document.createEvent("TouchEvent");
        return true;
      }
      catch(e) {
        return false;
      }
    }
    return spec;
  }());

  cntx.addStyles = function() {
    var styleString="",
        head = document.getElementsByTagName("head")[0],
        style = document.createElement("style");

    style.setAttribute("type","text/css");
    var styleNode = document.createTextNode(styleString);
    style.styleSheet ? style.styleSheet.cssText = styleString : style.appendChild(styleNode),
    head.appendChild(style);
  }

  cntx.addContext = function(elms) {
    for (var i = 0; i < elms[0].length; i++) { 
      cntx.eventListener(elms[0][i]);
    }
  }

  cntx.eventListener = function(item) {
    d3.select(item).on("mouseover", cntx.getAttr(this, 'over')).on("mouseout", cntx.getAttr(this, 'out')).on("click", cntx.getAttr(this, 'click'));
  }

  cntx.getAttr = function(elm, event) {
    var item = d3.select(this),
        attr = {};
    attr.elm = item;
    attr.title = cntx.checkAttr(item.attr('data-title'));
    attr.type = cntx.checkAttr(item.attr('data-type'));
    attr.data = {};
    attr.data.one = JSON.parse(cntx.checkAttr(item.attr('data-one')));
    attr.data.two = JSON.parse(cntx.checkAttr(item.attr('data-two')));
    attr.data.one[1] = parseInt(attr.data.one[1].replace(/[\W_]+/g,""));
    attr.data.two[1] = parseInt(attr.data.two[1].replace(/[\W_]+/g,""));
    return attr;
  }

  cntx.checkAttr = function(attr) {
    return (attr) ? attr : false;
  }


  

  cntx.typeSplitter = function(obj) {
    switch(obj.type) {
      case 'pie':
          cntx.pie(obj);
          break;
      case 'other':
          cntx.other(obj);
          break;
      default:
          cntx.pie(obj);
    }
  }

  cntx.pie = function(obj) {
    //create context
  }





  cntx.math = (function(){
    var spec = {};
    spec.round = function(number ,decimals) {
      decimals = decimals || 0;
      return number.toFixed(decimals);
    }
    spec.comma = function(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return spec;
  }());

  // add mouse position event listener
  cntx.getMousePos = function(e) {
    var coords = {};
    if (!e) var e = window.event;
    if (e.pageX || e.pageY)   {
      coords.x = e.pageX;
      coords.y = e.pageY;
    }
    else if (e.clientX || e.clientY)  {
      coords.x = e.clientX + document.body.scrollLeft
        + document.documentElement.scrollLeft;
      coords.y = e.clientY + document.body.scrollTop
        + document.documentElement.scrollTop;
    }
    cntx.mouseCoords.x = coords.x;
    cntx.mouseCoords.y = coords.y;
    return coords;
  }

  cntx.getElementPos = function(element) {
    var elmPos = {},
        body = document.body,
        win = document.defaultView,
        docElem = document.documentElement,
        box = document.createElement('div');
    box.style.paddingLeft = box.style.width = "1px";
    body.appendChild(box);
    var isBoxModel = box.offsetWidth == 2;
    body.removeChild(box);
    box = element.getBoundingClientRect();
    var clientTop  = docElem.clientTop  || body.clientTop  || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
        scrollTop  = win.pageYOffset || isBoxModel && docElem.scrollTop  || body.scrollTop,
        scrollLeft = win.pageXOffset || isBoxModel && docElem.scrollLeft || body.scrollLeft;

    elmPos.top = box.top  + scrollTop  - clientTop;
    elmPos.left = box.left + scrollLeft - clientLeft
    return elmPos;
  }

  // mouse coordinates accessible to all cntx methods
  cntx.mouseCoords = {
    x: 0,
    y: 0
  }

  cntx.E = function (selection) {
    var selectionArr = selection.split(' '),
    returnObj;
    for (var i = 0; i < selectionArr.length; i++) {
      var type = selectionArr[i].substring(0, 1),
      selector = selectionArr[i].substring(1);
      if (type === '#') {
        returnObj = (returnObj === undefined) ? document.getElementById(selector) : returnObj.getElementById(selector);

      }
      else if (type === '.') {
        selector = (selector.indexOf('.') > -1) ? selector.replace(/\./g, " ") : selector;
        returnObj = (returnObj === undefined) ? document.getElementsByClassName(selector)[0] : returnObj.getElementsByClassName(selector)[0];
      }
      else {
        return false;
      }
    }
    return returnObj;
  }

  cntx.tooltip = new function() {

    var addSheet = (function(){
      var styleString=".cntx{ font-family:officina, arial; font-size:15px; } .cntxTooltip{-webkit-border-radius:5px; -moz-border-radius:5px; border-radius:5px; visibility:hidden; width:auto; height:auto; position:absolute; top:0; left:0; padding:10px; /*display:none;*/ background-color: grey; color: white; z-index: 500; }",
          head = document.getElementsByTagName("head")[0],
          style = document.createElement("style");

      style.setAttribute("type","text/css");
      var styleNode = document.createTextNode(styleString);
      style.styleSheet ? style.styleSheet.cssText = styleString : style.appendChild(styleNode),
      head.appendChild(style);
    })();

    // api for tooltip
    this.spec = {
      id: 0,
      selection: ''
    }

    this.addToSpec = function(obj, val) {
      cntx.tooltip.spec[obj] = val;
      return this;
    }

    this.select = function(selection, parent) {
      if(parent) { cntx.tooltip.addToSpec('parent', parent); }
      cntx.tooltip.addToSpec('selection', selection);
      return this;
    }

    this.include = function(obj) {
      obj = obj || document.body;
      cntx.tooltip.addToSpec('parent', obj).addToSpec('parentWidth', obj.offsetWidth).addToSpec('parentHeight', obj.offsetHeight);
      obj.style.position = 'relative';
      cntx.tooltip.spec.id++;
      if (cntx.tooltip.spec.parent.getAttribute("onmousemove") !== "cntx.getMousePos(event);") {
        cntx.tooltip.spec.parent.setAttribute("onmousemove","cntx.getMousePos(event);");
      }

      function create(htmlStr) {
        var frag = document.createDocumentFragment(),
            temp = document.createElement('div');
        temp.innerHTML = htmlStr;
        while (temp.firstChild) {
          frag.appendChild(temp.firstChild);
        }
        return frag;
      }
      // add tooltip
      var fragment = create('<div class="cntx cntxTooltip cntxTooltip' + cntx.tooltip.spec.id + '"></div>');
      obj.appendChild(fragment);

      return this;
    }

    this.add = function(elm) {
      var html = cntx.tooltip.spec.selection.innerHTML + elm;
      cntx.tooltip.spec.selection.innerHTML = html;
      return this;
    }

    this.style = function(style) {
      if (style instanceof Array) {
        for (var i = 0; i < style.length; i++) {
          var twoStyle = style[i].split(":");
          cntx.tooltip.spec.selection.style[twoStyle[0]] = twoStyle[1];
        }
      }
      else {
        var oneStyle = style.split(":");
        cntx.tooltip.spec.selection.style[oneStyle[0]] = oneStyle[1];
      }
      return this;
    }

    this.show = function() {
      var exW = 5, exH = 5;
      var rect = cntx.getElementPos(cntx.tooltip.spec.parent);
      cntx.tooltip.addToSpec('parentWidth', cntx.tooltip.spec.parent.offsetWidth);
      cntx.tooltip.addToSpec('parentHeight', cntx.tooltip.spec.parent.offsetHeight);
      cntx.tooltip.addToSpec('selectionWidth', cntx.tooltip.spec.selection.offsetWidth);
      cntx.tooltip.addToSpec('selectionHeight', cntx.tooltip.spec.selection.offsetHeight);
      if (cntx.mouseCoords.x > (cntx.tooltip.spec.parentWidth / 2) + rect.left ) {
        exW = exW - cntx.tooltip.spec.selectionWidth - 10;
      }
      if (cntx.mouseCoords.y > (cntx.tooltip.spec.parentHeight / 2) + rect.top ) {
        exH = exH - cntx.tooltip.spec.selectionHeight - 10;
      }
      cntx.tooltip.style(['left:' + ((cntx.mouseCoords.x + exW) - rect.left)  + 'px', 'top:' + ((cntx.mouseCoords.y + exH) - rect.top)  + 'px']);
      cntx.tooltip.style('visibility:visible');
      return this;
    }

    this.hide = function() {
      cntx.tooltip.style('visibility:hidden');
      return this;
    }

    this.update = function(update, show) {
      for (var i = 0; i < update.length; i++) {
        update[i][0].innerHTML = update[i][1];
      }
      if (show) {
        cntx.tooltip.show();
      }
      return this;
    }
  }

  cntx.init();

});





