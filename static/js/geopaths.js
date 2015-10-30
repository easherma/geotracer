
//leaflet has layer toggles, could have one map, button toggles the main layer off, cumaltive submissions from user
// Declare global variables
var coord_array = []
var UPDATE_INTERVAL = 30000; //unis of ms

var geocoderResults;
//marker array
//Create new grouping of non-user-submitted paths.
//We will add paths to the group as they are retrieved from the db.
var strangers_layer_group = L.layerGroup();

// Show the whole world in this first view.
var map = L.map('map', {
    bounceAtZoomLimits: true,
	 maxBounds:
	 [[-85.0, -180.0],
        [85.0, 180.0]],
    inertia: false,
	minZoom: 2,
	continuousWorld: false,
	layers: [strangers_layer_group]
}).setView([20, 0], 2);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
// LOOKS LIKE MAPZEN KEY HAS TO BE ON FRONT END
var options =
{
  position: 'topright'
}
var geocoder =  L.control.geocoder('search-daf-vyw', options).addTo(map);

// Transform a GeoJSON string '{type:"Point",coordinates:[x,y]}'
// into a leaflet LatLng object
function geoJSONToLLatLng(ptStr) {
  var p = JSON.parse(ptStr);
  return new L.LatLng(p.coordinates[1],p.coordinates[0]);
}

// REMOVED KEYS
// REMOVED LOADING FROM CARTODB DIRECTLY TO AVOID HAVING KEYS ON FRONT END
/*geoj.rows.forEach(function(row,i){
  if(row.p1 != null && row.p2 != null){
    var latlngs = [geoJSONToLLatLng(row.p1),geoJSONToLLatLng(row.p2)];
    var line = L.polyline(latlngs,{snakingSpeed: 200}); 
    line.addTo(map).snakeIn();
  }
})*/


var geojsonFeature = geoj
L.geoJson(geojsonFeature).addTo(map);


//Gets new rows from the server and plots them.
//update_map executes periodically and indefinitely until server returns error
// It is also asynchronous, so control moves past this line
//comment this for debugging
//Create leaflet control to toggle map layers
var overlayMaps = {
  "strangers": strangers_layer_group,
  "none" : L.layerGroup()
};
var overlayControl = L.control.layers(overlayMaps);
overlayControl.options.position = 'bottomright';
overlayControl.addTo(map);
//Snakein on each layer animates all at once
overlayMaps.strangers.eachLayer(function(x){x.snakeIn()});
//Snakein on the layergroup animates one at a time
//overlayMaps.strangers.snakeIn();

//Gets new rows from the server and plots them.
//update_map executes periodically and indefinitely until server returns error
// It is also asynchronous, so control moves past this line
//update_map();

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

function addMarkerToArray(coordPair) {
    coord_array.push(coordPair);
}

function post_array() {
  if (geocoder.markers.length >= 2) {
      
        // take each marker from the geocoder layer and map it to a new array
        var data = [];
        $.each(geocoder.markers, function(i, v) { 
            latlng = v.getLatLng();
            latitude = latlng.lat;
            longitude = latlng.lng;
            data.push([lng, lat]);
        });
      
    $.ajax({
       type : "POST",
       url : "/geo",
       data: JSON.stringify(geocoder.markers),
       contentType: 'application/json',
       success: function(result) {
         console.log("success");
         var latlngs = data.map(function(d){
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

//document.getElementById("submit_button").addEventListener("click", post_array);
