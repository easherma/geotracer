// This is an advanced example that is compatible with
// modern browsers and IE9+ - the trick it uses is animation
// of SVG properties, which makes it relatively efficient for
// the effect produced. That said, the same trick means that the
// animation is non-geographical - lines interpolate in the same
// amount of time regardless of trip length.
var coord_array = []
var UPDATE_INTERVAL = 30000; //unis of ms

// Show the whole world in this first view.

var map = L.map('map', {
    bounceAtZoomLimits: true,
	 maxBounds:
	 [[-85.0, -180.0],
        [85.0, 180.0]],
    inertia: false,
	minZoom: 2,
	continuousWorld: false
}).setView([20, 0], 2);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
// LOOKS LIKE MAPZEN KEY HAS TO BE ON FRONT END
var geocoder =  L.control.geocoder('search-daf-vyw', {
  position: 'topright'
}).addTo(map);

// Transform a GeoJSON string '{type:"Point",coordinates:[x,y]}'
// into a leaflet LatLng object
function geoJSONToLLatLng(ptStr) {
  var p = JSON.parse(ptStr);
  return new L.LatLng(p.coordinates[1],p.coordinates[0]);
}

// REMOVED KEYS
// REMOVED LOADING FROM CARTODB DIRECTLY TO AVOID HAVING KEYS ON FRONT END
geoj.rows.forEach(function(row,i){
  if(row.p1 != null && row.p2 != null){
    var latlngs = [geoJSONToLLatLng(row.p1),geoJSONToLLatLng(row.p2)];
    var line = L.polyline(latlngs,{snakingSpeed: 200}); 
    line.addTo(map).snakeIn();
  }
});

//Gets new rows from the server and plots them.
//update_map executes periodically and indefinitely until server returns error
// It is also asynchronous, so control moves past this line
update_map();

//Gets new rows from the server and plots them.
// Executes periodically and indefinitely until server returns an error.
// Operates asynchronously, so control flow is not tied up in this func.
function update_map() {
  $.ajax({
    type : "GET",
    url : "/more",
    data : "rowid=" + prevRowId,
    contentType : "text",
    success : function(result) {
      result.rows.forEach(function(row,i){
        if(row.p1 != null && row.p2 != null){
          var latlngs = [geoJSONToLLatLng(row.p1),geoJSONToLLatLng(row.p2)];
          var line = L.polyline(latlngs,{snakingSpeed: 200}); 
          line.addTo(map).snakeIn();
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
}

function post_array() {
  if (coord_array.length >= 2) {
    $.ajax({
       type : "POST",
       url : "/geo",
       data: JSON.stringify(coord_array),
       contentType: 'application/json',
       success: function(result) {
         console.log("success");
         var latlngs = coord_array.map(function(d){
           return new L.LatLng(d[1],d[0]);
         });
         var line = L.polyline(latlngs, {snakingSpeed: 200});
         line.addTo(map).snakeIn();
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
