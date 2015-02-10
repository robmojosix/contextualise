"use strict";

var cntx = cntx || {};

cntx.checkSupport = function(){
  return !!('createElementNS' in document &&
  document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect)
}

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

if (cntx.checkSupport()) {

  // load d3 and then cntx widget through callback
  cntx.callScript('http://d3js.org/d3.v3.min.js', function() {

    cntx.init = function(){
      // add css
      cntx.addStyles();
      // add live class
      d3.selectAll('.contextualiseJS').attr('class', 'contextualiseJS live');
      // start contextualise
      cntx.addContext(d3.selectAll('.contextualiseJS.live'));
    }

    cntx.checkMap = function() {
      return (d3.selectAll('.contextualiseJS[data-type=map]')[0].length > 0 ) ? true : false;
    }

    cntx.loadMapApi = function() {
      function loadScript() {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' +
            '&signed_in=false&callback=initialize';
        document.body.appendChild(script);
      }
      window.onload = loadScript;
    }

    if(cntx.checkMap()) {
      cntx.loadMapApi();
    };

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
        cntx.eventListener(elms[0][i], i);
      }
    }

    cntx.eventListener = function(item, id) {
      d3.select(item).on("mouseover", function() { cntx.splitter(this, id, 'over') }).on("mouseout", function() { cntx.splitter(this, id, 'out') }).on("click", function() { cntx.splitter(this, id, 'click') });
      window.onscroll = function (event) { cntx.removeCntxs(); }
      window.resize = function (event) { cntx.removeCntxs(); }
    }

    cntx.splitter = function(obj, id, event) {
      // get initial attributes for widget
      var attrs = cntx.getAttr(obj, id, event);

      // toggle view

      if(attrs.show === 'out' || attrs.show === 'click' && cntx.checkAttr(attrs.elm.attr('data-live'))) {
        cntx.removeCntx(attrs);
        return;
      }
      // if displaying go through splitter
      attrs.elm.attr('data-live', 'live');
      switch(attrs.type) {
        case 'donut':
            cntx.donut(attrs);
            break;
        case 'circles':
            cntx.circles(attrs);
            break;
        case 'bars':
            cntx.bars(attrs);
            break;
        case 'bar':
            cntx.bar(attrs);
            break;
        case 'image':
            cntx.image(attrs);
            break;
        case 'map':
            cntx.map(attrs);
            break;
        default:
            cntx.donut(attrs);
      }
    }

    cntx.getAttr = function(elm, id, event) {
      var item = d3.select(elm),
          attr = {};
      attr.elm = item;
      attr.id = 'cntx-id-' + id;
      attr.title = cntx.checkAttr(item.attr('data-title'));
      attr.subtitle = cntx.checkAttr(item.attr('data-subtitle'));
      attr.type = cntx.checkAttr(item.attr('data-type'));
      attr.extend = cntx.checkAttr(item.attr('data-extend'));
      attr.image = cntx.checkAttr(item.attr('data-image'));
      attr.data = {};
      attr.map = (attr.type === 'map') ? true : false;
      attr.zoom = parseInt(cntx.checkAttr(item.attr('data-zoom')));
      attr.show = event;
      attr.html = item.html();

      var dataArr = JSON.parse(cntx.checkAttr(item.attr('data-data'))),
          labelArr = JSON.parse(cntx.checkAttr(item.attr('data-labels')));

      for (var i = 0; i < dataArr.length; i++) {
        attr.data['d' + i] = {};
        for (var o = 0; o < dataArr.length; o++) {
          attr.data['d' + i]['data'] = parseInt(dataArr[i].replace(/[\W_]+/g,""));
          attr.data['d' + i]['number'] = dataArr[i];
          attr.data['d' + i]['label'] = labelArr[i];
        }
      }

      return attr;
    }

    cntx.donut = function(obj) {
      // add template
      var widget = cntx.chartTemplate(obj);

      // add chart
      var element = '#' + obj.id + ' .cntx-chart',
          padding = 20,
          size = widget[0][0].getBoundingClientRect().width - padding*4,
          width = size,
          height = size,
          datum = obj.data.d1.data / ((obj.data.d0.data + obj.data.d1.data) / 100),
          labelData = [{'data': obj.data.d0.number, 'label':  obj.data.d0.label}, {'data': obj.data.d1.number, 'label':  obj.data.d1.label}],
          dataset = (obj.extend && obj.data.d0.data + obj.data.d1.data < 100) ? [100 - (obj.data.d0.data + obj.data.d1.data), obj.data.d1.data, obj.data.d0.data] : [datum, 100 - datum],
          radius = Math.min(width, height) / 2,
          pie = d3.layout.pie().sort(null);

      var arc = d3.svg.arc()
            .innerRadius(radius - 40)
            .outerRadius(radius);

      var svg = d3.select(element).append('svg')
            .attr('width', width + padding)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + ((width / 2) + padding) + ',' + height / 2 + ')');

      var path = svg.selectAll('path')
            .data(pie(dataset))
            .enter().append('path')
            .attr('class', function(d, i) { var index = (obj.extend && i==0) ? 0 : 3-i; index = (!obj.extend) ? 2-i : index; return 'cntx-colour-' + index; })
            .transition().delay(function(d, i) { return i * 360; }).duration(500)
            .attrTween('d', function(d) {
              var i = d3.interpolate(d.startAngle, d.endAngle);
              return function(t) {
                d.endAngle = i(t);
                return arc(d);
              }
            });

      var labels = widget.append('div').attr('class', 'cntx-labels-container');

      labels.selectAll('div')
            .data(labelData)
            .enter().append('div')
            .attr('class', function(d, i) { return 'cntx-label cntx-label-data-' + i + ' cntx-colour-' + (i+1) })
            .html(function(d) { return d.data })
            .append('div')
            .attr('class', function(d, i) { return 'cntx-label-label-' + i + ' cntx-colour-' + (i+1)  })
            .html(function(d) { return d.label });

      cntx.postRender(obj);
    }

    cntx.circles = function(obj) {
      // add template
      var widget = cntx.chartTemplate(obj);

      // add chart
      var element = '#' + obj.id + ' .cntx-chart',
          padding = 20,
          betweenPadding = 5,
          size = widget[0][0].getBoundingClientRect().width - padding*2,
          width = size,
          labelData = [{'data': obj.data.d0.number, 'label':  obj.data.d0.label}, {'data': obj.data.d1.number, 'label':  obj.data.d1.label}],
          dataset = [obj.data.d0.data, obj.data.d1.data],
          areas = [Math.sqrt(dataset[0]*Math.PI), Math.sqrt(dataset[1]*Math.PI)],
          diameters = [(Math.sqrt(areas[0]/Math.PI))*2, (Math.sqrt(areas[1]/Math.PI))*2],
          sumDiameters = (diameters[0] + diameters[1]) / (width - betweenPadding),
          newDiameters = [diameters[0]/sumDiameters, diameters[1]/sumDiameters],
          max = d3.max(newDiameters),
          x = [0, newDiameters[0]/2 + newDiameters[1]/2 + betweenPadding],
          y = [(((newDiameters[0]/2) - (max/2)) + max) - newDiameters[0], (((newDiameters[1]/2) - (max/2)) + max)- newDiameters[1]],
          height = max;

      var svg = d3.select(element).append('svg')
            .attr('width', width + padding)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + newDiameters[0] / 2 + ',' + max / 2 + ')');

      var circles = svg.selectAll(".cntx-circles")
            .data(newDiameters)
            .enter().append("circle")
            .attr('class', function(d, i) { return 'cntx-circles cntx-colour-' + (i+1) })
            .attr("cy", function(d, i) { return y[i]; })
            .attr("cx", function(d, i) { return x[i]; })
            .attr("r", 0);

      circles.transition()
             .duration(600)
             .delay(function(d, i) { return i * 300; })
             .attr("r", function(d) { return d/2; })

      var labels = widget.append('div').attr('class', 'cntx-labels-container');

      labels.selectAll('div')
            .data(labelData)
            .enter().append('div')
            .attr('class', function(d, i) { return 'cntx-label cntx-label-data-' + i + ' cntx-colour-' + (i+1) })
            .html(function(d) { return d.data })
            .append('div')
            .attr('class', function(d, i) { return 'cntx-label-label-' + i + ' cntx-colour-' + (i+1)  })
            .html(function(d) { return d.label });

      cntx.postRender(obj);
    }

    cntx.bars = function(obj) {
      // add template
      var widget = cntx.chartTemplate(obj);

      // add chart
      var element = '#' + obj.id + ' .cntx-chart',
          padding = 20,
          size = d3.select(element)[0][0].getBoundingClientRect().width * 0.57,
          width = size,
          barHeight = 33,
          height = (barHeight*2) + 20,
          initData = [obj.data.d0.data, obj.data.d1.data],
          max = d3.max(initData),
          divider = max / size,
          dataset = [{'data': obj.data.d0.data / divider, 'number': obj.data.d0.number, 'label':  obj.data.d0.label}, {'data': obj.data.d1.data / divider, 'number': obj.data.d1.number, 'label':  obj.data.d1.label}];

      var container = d3.select(element)
                        .selectAll('.cntx-container')
                        .data(dataset)
                        .enter().append("div")
                        .attr('class', "cntx-container");

      var labelContainer = container.append('div')
                                    .attr('class', 'cntx-label-container');

      var labelData = labelContainer.append('div')
                            .attr('class', function(d, i) { return 'cntx-label cntx-colour-' + (i+1) })
                            .html(function(d) { return d.number });

      var labels = labelContainer.append('div')
                            .attr('class', function(d, i) { return 'cntx-label-label cntx-colour-' + (i+1) })
                            .html(function(d) { return d.label });

      var svg = container.append('div')
                         .attr('class', 'cntx-svg')
                         .append('svg')
                         .attr('width', width)
                         .attr('height', barHeight)
                         .append('g');

      var bars = svg.append("rect")
                    .attr('class', function(d, i) { return 'cntx-bars cntx-colour-' + (i+1) })
                    .attr("y", 0)
                    .attr("x", 0)
                    .attr("width", 0)
                    .attr("height", barHeight);

      bars.transition()
             .duration(600)
             .delay(function(d, i) { return i * 300; })
             .attr("width", function(d) { return d.data; })

      cntx.postRender(obj);
    }

    cntx.bar = function(obj) {
      // add template
      var widget = cntx.chartTemplate(obj);

      // add chart
      var element = '#' + obj.id + ' .cntx-chart',
          padding = 20,
          size = widget[0][0].getBoundingClientRect().width - padding*2,
          barHeight = 32,
          width = size,
          height = barHeight,
          datum = obj.data.d1.data / ((obj.data.d0.data + obj.data.d1.data) / 100),
          labelData = [{'data': obj.data.d0.number, 'label':  obj.data.d0.label}, {'data': obj.data.d1.number, 'label':  obj.data.d1.label}],
          datum = (obj.data.d0.data + obj.data.d1.data) / size,
          percentScale = 100 / size,
          dataset = (obj.extend && obj.data.d0.data + obj.data.d1.data < 100) ? [obj.data.d0.data / percentScale, (100 - (obj.data.d0.data + obj.data.d1.data)) / percentScale, obj.data.d1.data / percentScale] : [obj.data.d0.data / datum, obj.data.d1.data / datum],
          xStart = [0, dataset[0], dataset[0] + dataset[1]];

      var svg = d3.select(element).append('svg')
            .attr('width', width + padding)
            .attr('height', height)
            .append('g');

      var bar = svg.selectAll('.cntx-bar')
                    .data(dataset)
                    .enter()
                    .append("rect")
                    .attr('class', function(d, i) { var index = (i==1 && obj.extend) ? 0 : i+1; index = (i==2 && obj.extend) ? 2 : index; return 'cntx-bar cntx-colour-' + index })
                    .attr("x", function(d, i) { return xStart[i]; })
                    .attr("y", 0)
                    .attr("width", 0)
                    .attr("height", barHeight);

      bar.transition()
             .duration(400)
             .delay(function(d, i) { return i * 300; })
             .attr("width", function(d) { return d; })

      var labels = widget.append('div').attr('class', 'cntx-labels-container');

      labels.selectAll('div')
            .data(labelData)
            .enter().append('div')
            .attr('class', function(d, i) { return 'cntx-label cntx-label-data-' + i + ' cntx-colour-' + (i+1) })
            .html(function(d) { return d.data })
            .append('div')
            .attr('class', function(d, i) { return 'cntx-label-label-' + i + ' cntx-colour-' + (i+1)  })
            .html(function(d) { return d.label });

      cntx.postRender(obj);
    }

    cntx.image = function(obj) {
      // add template
      var widget = cntx.imageTemplate(obj),
          element = '#' + obj.id + ' .cntx-image';

      d3.select(element).attr('src', obj.image);

      cntx.postRender(obj);
    }

    cntx.map = function(obj) {
      // add template
      var widget = cntx.chartTemplate(obj),
          maps = [],
          locations = [];

      if(obj.extend !== false) {
        d3.selectAll('.contextualiseJS').each(function() {
          if(d3.select(this).attr('data-extend') === obj.extend) {
            maps.push(d3.select(this));
          }
        });
      }
      else {
        maps.push(obj.elm);
      }

      maps.forEach(function(d, i) {
        var tempArr = [],
            geocoder = new google.maps.Geocoder();

        geocoder.geocode( { 'address': maps[i][0][0].firstChild.data}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            tempArr.push(maps[i][0][0].firstChild.data);
            tempArr.push(results[0].geometry.location.D);
            tempArr.push(results[0].geometry.location.k);
            tempArr.push(i+1);
            locations.push(tempArr);
          } else {
            console.log('error loading lat long from Google');
          }
          if(i === (maps.length - 1)) {
            cntx.createMap(locations, maps, obj);
          }
        });
      });
      cntx.postRender(obj);
    }

    cntx.createMap = function(locations, maps, obj) {
      // label extention to Google maps api
      function Label(opt_options) {
        // Initialization
        this.setValues(opt_options);

        // Label specific
        var span = this.span_ = document.createElement('span');
        span.className = 'cntxLabel';

        var div = this.div_ = document.createElement('div');
        div.appendChild(span);
        div.style.cssText = 'position: absolute; display: none';
      };
      Label.prototype = new google.maps.OverlayView;

      // Implement onAdd
      Label.prototype.onAdd = function() {
        var pane = this.getPanes().overlayLayer;
        pane.appendChild(this.div_);

        // Ensures the label is redrawn if the text or position is changed.
        var me = this;
        this.listeners_ = [
          google.maps.event.addListener(this, 'position_changed',
            function() { me.draw(); }),
          google.maps.event.addListener(this, 'text_changed',
            function() { me.draw(); })
        ];
      };

      // Implement onRemove
      Label.prototype.onRemove = function() {
        this.div_.parentNode.removeChild(this.div_);

        // Label is removed from the map, stop updating its position/text.
        for (var i = 0, I = this.listeners_.length; i < I; ++i) {
          google.maps.event.removeListener(this.listeners_[i]);
        }
      };

      // Implement draw
      Label.prototype.draw = function() {
        var projection = this.getProjection();
        var position = projection.fromLatLngToDivPixel(this.get('position'));

        var div = this.div_;
        div.style.left = position.x + 'px';
        div.style.top = position.y + 'px';
        div.style.display = 'block';
      };

      var centerMap = [];

      for (i = 0; i < locations.length; i++) {
        if (maps[i].attr('data-data')) {
          var dataArr = JSON.parse(cntx.checkAttr(maps[i].attr('data-data')));
          locations[i][1] = dataArr[0];
          locations[i][2] = dataArr[1];
        }
      }

      centerMap.push(locations[0][1]);
      centerMap.push(locations[0][2]);

      var zoomer = (obj.zoom < 11) ? obj.zoom : 5;

      var map = new google.maps.Map(document.getElementById(obj.id), {
        zoom: zoomer,
        center: new google.maps.LatLng(centerMap[1], centerMap[0]),
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });

      map.set('styles', [{
        "featureType":"landscape.natural",
        "elementType":"geometry.fill",
        "stylers":[{"visibility":"on"},{"color":"#53535A"}]},
        {"featureType":"poi",
        "elementType":"geometry.fill",
        "stylers":[{"visibility":"on"},{"color":"#53535A"}]},
        {"featureType":"road",
        "elementType":"geometry",
        "stylers":[{"lightness":100},{"visibility":"simplified"}]},
        {"featureType":"road",
        "elementType":"labels",
        "stylers":[{"visibility":"off"}]},
        {"featureType": "all",
        "elementType": "labels",
        "stylers": [{ "visibility": "off" }]},
        {"featureType": "administrative.country",
        "elementType": "labels",
        "stylers": [{ "visibility": "on" }]},
        {"featureType": "road",
        "stylers":[{"visibility": "off"}]},
        {"featureType":"water",
        "elementType":"all",
        "stylers":[{"color":"#14141E"}]}]
      );

      var infowindow = new google.maps.InfoWindow();

      var marker, i;

      for (i = 0; i < locations.length; i++) {  
        marker = new google.maps.Marker({
          position: new google.maps.LatLng(locations[i][2], locations[i][1]),
          map: map,
          icon: {
            path: "M6.957,11.993c-2.757,0-5-2.244-5-5.001s2.243-5,5-5s5,2.243,5,5S9.714,11.993,6.957,11.993z",
            fillColor: "#CFFF45",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#14141E",
            anchor: new google.maps.Point(7, 7)
          }
        });
        var label = new Label({
          map: map
        });
        label.bindTo('position', marker, 'position');
        label.bindTo('text', marker, 'position');
        label.span_.innerHTML = locations[i][0];
      }

      if (locations.length > 1) {
        var LatLngList = [];
        for (var i = 0; i < locations.length; i++) {
          LatLngList.push(new google.maps.LatLng(locations[i][2], locations[i][1]));
        }
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
          bounds.extend(LatLngList[i]);
        }
        map.fitBounds(bounds);

        if (obj.zoom) {
          google.maps.event.addListenerOnce(map, 'idle', function(){
            map.setZoom(obj.zoom);
          });
        }
      }
    } 

    cntx.chartTemplate = function(obj) {
      var widget = obj.elm.append('div').attr('id', obj.id).attr('class', 'cntx-widget cntx-chart-' + obj.type),
          widgetClass = (obj.map) ? 'cntx-map' : 'cntx-chart',
          header = widget.append('div').attr('class', 'cntx-title').text(function() { var title = (obj.title) ? obj.title : ''; return title; });
      if (obj.subtitle) { header.append('div').attr('class', 'cntx-subtitle').text(obj.subtitle); }
      widget.append('div').attr('class', widgetClass);
      return widget;
    }

    cntx.imageTemplate = function(obj) {
      var imageClass = (obj.extend) ? 'cntx-image-chart' : 'cntx-image',
          widget = obj.elm.append('div').attr('id', obj.id).attr('class', 'cntx-widget ' + imageClass);
      widget.append('img').attr('class', 'cntx-image');
      return widget;
    }

    cntx.postRender = function(obj) {
      obj.widget = d3.select('#' + obj.id);
      cntx.showWidget(obj, cntx.getCoords(obj));
    }

    cntx.showWidget = function(obj, pos) {
      obj.widget.style('top', pos.x).style('left', pos.y);
      obj.widget.style('visibility', 'visible');
    }

    cntx.removeCntx = function(elm) {
      elm.elm.attr('data-live', '');
      elm.elm.selectAll('.cntx-widget').remove();
    }

    cntx.removeCntxs = function() {
      d3.selectAll('.contextualiseJS').attr('data-live', '');
      d3.selectAll('.cntx-widget').remove();
    }

    cntx.checkAttr = function(attr) {
      return (attr) ? attr : false;
    }

    cntx.getCoords = function(obj) {
      var atX,
          atY,
          topPadding = 5,
          rightPadding = 20,
          screenWidth = cntx.getViewport(),
          elmPos = obj.elm[0][0].getBoundingClientRect(),
          widgetPos = obj.widget[0][0].getBoundingClientRect(),
          atX = (elmPos.top) - (widgetPos.height + topPadding),
          atY = (elmPos.left + (elmPos.width/2)) - (widgetPos.width/2),
          yBurst = atY + widgetPos.width;


      if (atY < 0 || screenWidth.vw < 321) {
        atY = 10;
      }
      else if (yBurst > (screenWidth.vw - document.body.scrollLeft - rightPadding)) {
        atY = (atY - (yBurst - screenWidth.vw)) - rightPadding;
      }
      else if (screenWidth.vw < 301) {
        atY = 0;
      }

      if (atX < 0) {
        atX = (atX + widgetPos.height) + (topPadding*2) + elmPos.height;
      }

      return {x: atX + 'px', y: atY + 'px'}
    }

    cntx.getViewport = function() {
      var viewportwidth;
      var viewportheight;

      // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
      if (typeof window.innerWidth != 'undefined') {
        viewportwidth = window.innerWidth,
        viewportheight = window.innerHeight
      }

      // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
      else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
        viewportwidth = document.documentElement.clientWidth,
        viewportheight = document.documentElement.clientHeight
      }

      // older versions of IE
      else {
        viewportwidth = document.getElementsByTagName('body')[0].clientWidth,
        viewportheight = document.getElementsByTagName('body')[0].clientHeight
      }

      return {vh: viewportheight, vw: viewportwidth}
    }

    cntx.init();

  });

}