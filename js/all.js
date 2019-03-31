var tree = {};
var key = "index";
var keys = [];
function readData() {

   // read the data from our spreadsheet
   jQuery.get('data/data_nodes.CSV', function (data) {
      // convert the data to a structure
      var lines = data.split("\n");
      // read the header line
      var hl = lines.shift().split(";");
      // create array of keys for legend

      // fuege die ueberschriften zum dropdown hinzu
      for (var i = 0; i < hl.length; i++) {
         //if (hl[i] == "x" || hl[i] == "y" || hl[i] == "index" || hl[i] == "emptycolumn" ||
         //hl[i] == "produkt")
         //   continue;
         if (hl[i] == "Typ" || hl[i] == "Mobile" || hl[i] == "Content_oder_Software"
             || hl[i] == "Nuggets" || hl[i] == "Awards" || hl[i] == "Lernart" ||
             hl[i] == "Lernweg" || hl[i] == "Lerninhalte") {
            keys.push(hl[i]);
            jQuery('#selectChoice').append("<option value='" + hl[i] + "'>" + hl[i] + "</option>");
         }

      }

      var d = { 'nodes': [], 'links': [] };
      for (var i = 0; i < lines.length; i++) {
         var l = lines[i].split(";");
         var n = {};
         for (var j = 0; j < l.length; j++) {
            n[hl[j]] = l[j];
         }
         d['nodes'].push({"name": "line_" + i, 'values': n});
      }

      jQuery.get('data/data_edges.CSV', function (data) {
         var lines = data.split("\n");
         lines.shift(); // ignore the header line
         for (var i = 0; i < lines.length; i++) {
            var n = lines[i].split(";");
            //console.log("from: " + n[0] +" to " + n[1]);
            var source = n[0];
            var target = n[1];
            var vv = d['nodes'][source]['values'][key];
            if (typeof vv !== 'undefined' && typeof source !== 'undefined' && typeof target !== 'undefined') {
               d['links'].push({"source": (source - 1), "target": (target - 1), "value": vv}); // take the third value
            }
         }
         // now start processing
         tree = d;
         var currentChoice = jQuery('#selectChoice').val();
         plotGraph(currentChoice);
         //plotBar(currentChoice);
         plotBarhorizontal(currentChoice);
      });
   });
}

function processData( choice ) {
   console.log("hab die Dateien eingelesen....");
   //console.log(JSON.stringify(tree, null, 2))
   // use the key to create a value (instead of values)
   var d = { "nodes": [], "links": [] };
   for (var i = 0; i < tree['nodes'].length; i++) {
      d['nodes'].push({ 'userID': i,
         'out': 0,
         'in': 0,
         'choice': tree['nodes'][i]['values'][choice],
         'Produkt': tree['nodes'][i]['values']['Produkt'],
         'Firma': tree['nodes'][i]['values']['Firma'],
         'Typ': tree['nodes'][i]['values']['Typ'],
         'Info': tree['nodes'][i]['values']['Info'],
         'Format': tree['nodes'][i]['values']['Format'],
         'Mobile': tree['nodes'][i]['values']['Mobile'],
         'webadresse': tree['nodes'][i]['values']['webadresse'],
         'Nuggets': tree['nodes'][i]['values']['Nuggets'],
         'zeit fuer kleinste UE': tree['nodes'][i]['values']['zeit fuer kleinste UE'],
         'Content_oder_Software': tree['nodes'][i]['values']['Content_oder_Software'],
         'Awards': tree['nodes'][i]['values']['Awards'],
         'Lernart': tree['nodes'][i]['values']['Lernart'],
         'Lernweg': tree['nodes'][i]['values']['Lernweg'],
         'Lerninhalte': tree['nodes'][i]['values']['Lerninhalte'],
         'size': tree['nodes'][i]['values']['nodesize']

      });
   }
   for (var i = 0; i < tree['links'].length; i++) {
      d['links'].push({ 'source': tree['links'][i]['source'],
         'target': tree['links'][i]['target']
      });
   }

   //console.log(JSON.stringify(nestedData));
   return d
}

function countChoices(choice, d) {
   // count unique elements in selected choice (data column)
   var countedUniques = d3.nest()
       .key(function(d) {return d.choice;})
       .rollup((function(v) { return v.length; }))
       .entries(d['nodes']);

   //countedUniques.forEach(function(element) {
   //   console.log(element);
   //});
   return countedUniques;
}


function plotBarhorizontal( choice ) {
   // get data for plotting bar chart
   var d = processData( choice );
   var countedChoices = countChoices(choice, d);

   // run all the d3 code we need to plot
   /* SVG frame creation */
   var w = jQuery('#image').width()/2,
       h = jQuery('#image').height()/3;

   //var colors = d3.scaleOrdinal(d3.schemeCategory10); // for version d3.v5.min.js
   var colors = d3.scale.category10(); // for version d3.v3.min.js

   var bar = d3.select("svg").append("g");
//       .attr("width", w)
 //      .attr("height", h )
  //     .attr("opacity", 1);
   var translation = w*1.5;
   var chart = bar.append('g')
       .attr("transform", "translate(" + translation  + ", 10)");
   /* Start transition */
   bar.style("opacity", 1e-6)
       .transition()
       .duration(1000)
       .style(".axis line", "stroke: #000;")
       .style("opacity", 1);
   //// Scales
   var xScale = d3.scale.linear()
       .range([0, w*0.3])
       .domain([0, d3.max(countedChoices, function(a) { return a['values']; }) + 5]);
   var yScale = d3.scale.ordinal()
       .domain(countedChoices.map(function(a) {return a['key'];}))
       .rangeRoundBands([h, 0], .1);

   ////// Axis
   var xAxis = d3.svg.axis()
       .scale(xScale)
       .orient("top");
   var yAxis = d3.svg.axis()
       .scale(yScale)
       .tickSize(0)
       .orient("left");

   chart.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0, " + w + ")");
       //.call(xAxis);
   chart.append("g")
       .attr("class", "y axis")
       .call(yAxis);

   //// Title
   /*chart.append("text")
       .text('Absolute Häufigkeiten')
       .attr("text-anchor", "middle")
       .attr("class", "graph-title")
       .attr("y", -10)
       .attr("x", w / 4.0);*/
   //// Bars
   var bars = chart.selectAll(".bar")
       .data(countedChoices)
       .enter().append("rect")
       .attr("class", "bar")
       .attr("x", 0)
       .attr("y", function(a) {return yScale(a['key']); } )
       .attr("height", yScale.rangeBand())
       .attr("fill", function(a) {return colors(a['key'])})
       .attr("width", function(a) { return (xScale(a['values']));} );
   //.attr("height", 0);
   bars.transition()
       .duration(1500)
       //.ease("elastic")
       .attr("x", 0 )
       .attr("width", function(a) { return (xScale(a['values'])); });
   var numbers = chart.selectAll(".number")
       .data(countedChoices)
       .enter().append("text")
  // bars.append("text")
       .attr("class", "label")
       // y position of the label is halfway down the bar
       .attr("y", function(a) { return yScale(a['key']) + yScale.rangeBand() / 2.0 + 4; })
       .attr("x", function(a) {
          // var w = xScale(a['values']);
          // var places = 1;
          // var b = a['values']
          // while(b > 1) {
          //    places++;
          //    b /= 10;
          // }
          // if (w > 20)
          //    return xScale(a['values']) - 20 + (places);
          return xScale(a['values']) + 3;
       })
       .text(function(d) { return d['values'];});
}


function plotBar(choice ) {
   // get data for plotting bar chart
   var d = processData( choice );
   var countedChoices = countChoices(choice, d);
   //console.log("counted choices: ");
   console.log(countedChoices);

   // run all the d3 code we need to plot
   /* SVG frame creation */
   var w = jQuery('#barchart').width(),
       h = jQuery('#barchart').height();

   //var colors = d3.scaleOrdinal(d3.schemeCategory10); // for version d3.v5.min.js
   var colors = d3.scale.category10(); // for version d3.v3.min.js


   var bar = d3.select("#barchart").append("svg")
       .attr("width", w)
       .attr("height", h )
       .attr("opacity", 1);
   /*bar.style("opacity", 1e-6)
       .transition()
       .duration(1000)
       .style(".axis line", "stroke: #000;")
       .style("opacity", 1);*/
   var chart = bar.append('g')
       .attr("transform", "translate(10, 20)");
   /* Start transition */

   //// Scales
   var xScale = d3.scale.ordinal()
       .domain(countedChoices.map(function(a) {return a['key'];}))
       .rangeRoundBands([0, w / 2.0], .1);
   var yScale = d3.scale.linear()
       .range([h, 0])
       .domain([0, d3.max(countedChoices, function(a) { return a['values']; }) + 5]);
   ////// Axis
   var xAxis = d3.svg.axis()
       .scale(xScale)
       .orient("bottom");
   var yAxis = d3.svg.axis()
       .scale(yScale)
       .orient("left");
   chart.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0, " + h + ")")
       .call(xAxis);
   chart.append("g")
       .attr("class", "y axis")
       .call(yAxis);

   //// Title
   chart.append("text")
       .text('Absolute Häufigkeiten')
       .attr("text-anchor", "middle")
       .attr("class", "graph-title")
       .attr("y", -10)
       .attr("x", w / 4.0);
   //// Bars
   var bars = chart.selectAll(".bar")
       .data(countedChoices)
       .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(a) {return xScale(a['key']); })
          .attr("y", 0 )
          .attr("width", xScale.rangeBand())
          .attr("fill", function(a) {return colors(a['key'])})
          .attr("height", function(a) { return (h - yScale(a['values']));} );
          //.attr("height", 0);
   bars.transition()
        .duration(1500)
        //.ease("elastic")
        .attr("y", 0 )
        .attr("height", function(a) { return (h - yScale(a['values'])); });

}

// get a key from the d
function plotGraph( choice ) {

   d = processData( choice );
   // run all the d3 code we need to plot
   /* SVG frame creation */
   var w = jQuery('#image').width(), // set width of graph space to two-third of available space
       h = jQuery('#image').height(),
       fbBlue = d3.rgb("#3b5998"),
       fill = [fbBlue.brighter(2),fbBlue.brighter(),fbBlue,fbBlue.darker()];

   //var colors = d3.scaleOrdinal(d3.schemeCategory10); // for version d3.v5.min.js
   var colors = d3.scale.category10();// for version d3.v3.min.js

   ////// LEGEND //////
   // create dict with key and color values for legend
   var color_key = {};
   for (var i = 0; i < tree['nodes'].length; i++) {
      color_key[d['nodes'][i][choice]] = colors(d['nodes'][i][choice]);
      //console.log(colors(d['nodes'][i][choice]))
   }
   //console.log(color_key)
  /* var legend_keys = Object.keys(color_key);
   var legend_text = Object.values(color_key);
   //console.log(Object.values(color_key))
   var w_legend = jQuery('#legend').width(),
       h_legend = jQuery('#legend').height();
   var legend = d3.select("#legend").append("svg")
       .attr("width", w_legend)
       .attr("height", h_legend )
       .attr("opacity", 1);

   legend.selectAll("mydots")
       .data(legend_keys)
       .enter()
       .append("circle")
          .attr("cx", 20)
          .attr("cy", function(d,i) {return 120 + i*25})
          .attr("r", 7)
          .style("fill", function(d) { return colors(d) });
   // Add one dot in the legend for each name.
    legend.selectAll("mylabels")
        .data(legend_keys)
        .enter()
        .append("text")
          .attr("x", 40)
          .attr("y", function(d,i){ return 120 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
          .style("fill", function(d){ return "#1f77b4" })
          .text(function(d){ return d})
          .attr("text-anchor", "left")
          .style("alignment-baseline", "middle");*/
   /*var nodes = d3.range(211,261).map(function(i){
      return {
         userID: i,
         in: 0,
         out: 0
      }
   }); */
   var nodes = d['nodes'];

   var vis = d3.select("#image").append("svg:svg")
       .attr("width", w)
       .attr("height", h)
       .attr("display", "block");

   var links = d['links'];


   /* Store number of connections of each node */
   links.forEach(function(d, i){
      nodes[d.source].out++;
      nodes[d.target].in++;
   });

   /* Force paramettring */
   var force = d3.layout.force()// for version d3.v3.min.js
       .charge(-80)
       .linkDistance(50)
       .linkStrength(0.2)
       .size([w, h])
       .nodes(nodes)
       .links(links)
       .start();

   var translation = -1*w/8.0;
   /*Link creation template */
   var link = vis.selectAll(".link")
       .data(links)
       .enter()
       .append("line")
       .attr("transform", "translate("+ translation + ", 0 )")
       .attr("class", "link");


   /*Node creation template */
   var node = vis.selectAll("circle.node")
       .data(nodes)
       .enter().append("svg:circle")
       .attr("class", "node")
       .attr("cx", function(d) { return d.x; }) //x
       .attr("cy", function(d) { return d.y; }) //y
       .attr("r", function(d,i) {
          // size of the nodes
            return d.size;
            //return 4+parseInt((d.out+1)/3);
       })
       .attr("transform", "translate("+ translation + ", 0 )")
       .style("fill", function(d, i) {
          // instead of d.in use choice select
          var c = d.choice;
          //console.log(c)
          return colors(c);
          // how to create a color from a choice?
          // return fill[parseInt((d.in+1)/3)];
       })
       .call(force.drag);

   /*node.append("title")
       .text(function(d) { return "User "+d.userID; });*/

   /* Start transition */
   vis.style("opacity", 1e-6)
       .transition()
       .duration(1000)
       .style("opacity", 1);

//Forces in action
   force.on("tick", function(e) {
      /* Clustering: Push odd/even nodes up/down, something alike for left/right
      var k = 6 * e.alpha;
      nodes.forEach(function(o, i) {
        o.y += i & 1 ? k : -k;
        o.x += i & 2 ? k : -k;
      }); //clustering end*/
      // Get items coords (then whole force's maths managed by D3)

      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
   });

   /* Click-plosion and tooltip*/
   d3.select("#image").on("dblclick", function() {
      nodes.forEach(function(o, i) {
         o.x += Math.sign(Math.random() - 0.5) * (50 + Math.random() * 100);
         o.y += Math.sign(Math.random() - 0.5) * (50 + Math.random() * 100);
      });
      force.resume();
   });
   /*d3.selectAll('.node').on('click', function(d, i){
      var d3this = d3.select(this);
      if(d3this.style("fill") == 'rgb(255, 165, 0)')
         d3this.style('fill', 'green');
      else if(d3this.style("fill") == 'rgb(0, 128, 0)')
         d3this.style("fill", fill[parseInt((d.in+1)/3)]);
      else
         d3this.style("fill",'orange');
      d3.event.stopPropagation();
   });
   */
   d3.selectAll(".node").on("dblclick", function(d, i){
      d.fixed = !d.fixed;
      d3.event.stopPropagation();
   });
   var div = d3.select("div.tooltip");
   d3.selectAll(".node").on("mouseover", function(d, i){
      div.style("visibility", "visible")
          .transition()
          .duration(200)
          .style("opacity", .9);
      var html;
      //if(d.in == d.out) {
      //   html = "userID: " + d.userID + "<br/>" + d.in + " connections"
      //} else {
      //   html = "userID: " + d.userID + "<br/>" + d.in + " in, " + d.out + " out"
      //}
      html = "<table><tbody>" +
          "<tr>" + "<td>"+ "Produkt: " + "</td><td>" + d.Produkt + "</td></tr>" +
          "<tr>" + "<td>"+ "Typ: " + "</td><td>" + d.Typ + "</td></tr>" +
          "<tr>" + "<td>"+ "Firma: " + "</td><td>" + d.Firma + "</td></tr>" +
          "<tr>" + "<td>"+ "Info: " + "</td><td>" + d.Info + "</td></tr>" +
          "<tr>" + "<td>"+ "Mobile Version: " + "</td><td>" + d.Mobile + "</td></tr>" +
          "<tr>" + "<td>"+ "Adresse: " + "</td><td>" + d.webadresse + "</td></tr>" +
          "<tr>" + "<td>"+ "Nuggets:" + "</td><td>" + d.Nuggets + "</td></tr>" +
          "<tr>" + "<td>"+ "Content oder Software: " + "</td><td>" + d.Content_oder_Software + "</td></tr>" +
          "<tr>" + "<td>"+ "Awards: " + "</td><td>" + d.Awards + "</td></tr>" +
          "<tr>" + "<td>"+ "Lernart: " + "</td><td>" + d.Lernart + "</td></tr>" +
          "</tbody>"

/*
          "Produkt: " + "&emsp;" + d.produkt + "<br/>" +
          "Typ: " + "&emsp;" + d.typ + "<br/>" +
          "Format: " + "&emsp;" + d.format + "<br/>" +
          "Index: " + "&emsp;" + d.choice + "<br/>" +
          "Firma: " + "&nbsp; &nbsp;" + d.firma + "<br/>" +
          "Info: " + "&nbsp; &nbsp;" + d.info + "<br/>" +
          "Mobile? " + "&nbsp; &nbsp;" + d.mobile + "<br/>" +
          "Adresse: " + "&nbsp; &nbsp;" + d.webadresse + "<br/>" +
          "Nuggets? " + "&nbsp; &nbsp;" + d.nuggets
          */
      div.html(html)
          .style("left", (d.x + 15) + "px")
          .style("top", (d.y - 30) + "px");
   }).on("mouseout", function(d, i){
      div.transition()
          .duration(500)
          .style("opacity", 0)
          .each("end", function(){
             div.style("visibility", "hidden")
          });
   });
}

jQuery(document).ready(function() {

   // Einlesen der Daten
   readData();
   jQuery('#selectChoice').on('change', function() {
      jQuery('#image').children().remove();
      jQuery('#legend').children().remove();
      jQuery('#barchart').children().remove();
      jQuery('#barchartHorizontal').children().remove();
      jQuery('#image').append("<div class='tooltip'></div>")
      var currentChoice = jQuery('#selectChoice').val();
      plotGraph(currentChoice);
      //plotBar(currentChoice);
      plotBarhorizontal(currentChoice);
   });

   // kann nichts machen .. daten sind noch nicht eingelesen :-(
});