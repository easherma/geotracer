// This is an advanced example that is compatible with
// modern browsers and IE9+ - the trick it uses is animation
// of SVG properties, which makes it relatively efficient for
// the effect produced. That said, the same trick means that the
// animation is non-geographical - lines interpolate in the same
// amount of time regardless of trip length.
var coord_array = [];
var UPDATE_INTERVAL = 30000; //unis of ms

// Show the whole world in this first view.
map = L.map('map')
    .setView([20, 0], 2);
//var map = L.map('map').setView([40.7259, -73.9805], 12);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Disable drag and zoom handlers.
// Making this effect work with zooming and panning
// would require a different technique with different
// tradeoffs.
map.dragging.disable();
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();
if (map.tap) map.tap.disable();

// LOOKS LIKE MAPZEN KEY HAS TO BE ON FRONT END
L.control.geocoder('search-daf-vyw', {
  position: 'topright'
}).addTo(map);

// Transform a GeoJSON string '{type:"Point",coordinates:[x,y]}'
// into the {x,y} expected by arc.js.
function geoJSONToXY(ptStr) {
  var p = JSON.parse(ptStr);
  return {y: p.coordinates[1], x: p.coordinates[0]};
}

// REMOVED KEYS
// REMOVED LOADING FROM CARTODB DIRECTLY TO AVOID HAVING KEYS ON FRONT END
geoj.rows.forEach(function(row,i){
  if(row.p1 != null && row.p2 != null){
    plotArc(geoJSONToXY(row.p1),geoJSONToXY(row.p2),i);
  }
});



(function update_map() {
  $.ajax({
    type : "GET",
    url : "/more",
    data : "rowid=" + prevRowId,
    rontentType : "text",
    success : function(result) {
      result.rows.forEach(function(row,i){
        if(row.p1 != null && row.p2 != null){
          plotArc(geoJSONToXY(row.p1),geoJSONToXY(row.p2),i);
        }
        if(prevRowId < row.cartodb_id){
          prevRowId = row.cartodb_id;
        }
      });
      setTimeout(update_map,UPDATE_INTERVAL);
    },
    error : function(error) {
      console.log("error: " + error);
    }
  });
}());



function plotArc(p1,p2,animationOffset){
    // Transform pair of coordinates into a pretty
    // great circle using the Arc.js plugin, as included above.
    var generator = new arc.GreatCircle(p1,p2);
    var line = generator.Arc(100, { offset: 10 });
    var colors = ["#b2182b", "#2166ac", "#762a83", "#1a9850", "#5ab4ac", "#fee08b"];
    var selected_color = colors[Math.floor(Math.random() * 6)];
    var newLine = L.polyline(line.geometries[0].coords.map(function(c) {
        return c.reverse();
    }), {
        color: selected_color,
        weight: 1.5,
        opacity: 0.75
    })
    .addTo(map);
    var totalLength = newLine._path.getTotalLength();
    newLine._path.classList.add('path-start');
    // This pair of CSS properties hides the line initially
    // See http://css-tricks.com/svg-line-animation-works/
    // for details on this trick.
    newLine._path.style.strokeDashoffset = totalLength;
    newLine._path.style.strokeDasharray = totalLength;
    // Offset the timeout here: setTimeout makes a function
    // run after a certain number of milliseconds - in this
    // case we want each flight path to be staggered a bit.
    setTimeout((function(path) {
        return function() {
            // setting the strokeDashoffset to 0 triggers
            // the animation.
            path.style.strokeDashoffset = 0;
        };
    })(newLine._path), animationOffset * 100);
};

function post_array() {
  if (coord_array.length >= 2) {
    $.ajax({
       type : "POST",
       url : "/geo",
       data: JSON.stringify(coord_array),
       contentType: 'application/json',
       success: function(result) {
         console.log("success");
         for (var i = 1; i < coord_array.length; ++i) {
           var p1 = {y: coord_array[i - 1][1], x: coord_array[i - 1][0]};
           var p2 = {y: coord_array[i][1], x: coord_array[i][0]};
           plotArc(p1, p2, i);
         }
         coord_array.length = 0;
         document.getElementById("array-warn").innerText = "";
       },
       error: function (error) {
         console.log("error: " + eval(error));
       }
     });
  }
  else {
    document.getElementById("array-warn").innerText = "Please select at least two points before submitting";
  }
};

document.getElementById("submit_button").addEventListener("click", post_array);
