/* ************ MAIN ************ */

// Declare global variables
var UPDATE_INTERVAL = 30000; //unis of ms
var geocoderResults; //Referenced in Pelias js 

//Create groupings for user-submitted results.
//We will add points to this group as they are geocoded & confirmed by user.
var confirmed_pts = L.layerGroup();
//We will add points to this group as they are submitted.
var user_layer_group = L.layerGroup();

//Create grouping of non-user-submitted paths.
//We will add paths to the group as they are retrieved from the db.
var strangers_layer_group = L.featureGroup();

// Show the whole world in this first view.
var map = L.map('map', {
  bounceAtZoomLimits: true,
  maxBounds: [[-85.0, -180.0],[85.0, 180.0]],
  inertia: false,
  minZoom: 2,
  continuousWorld: false,
  layers: [confirmed_pts,user_layer_group,strangers_layer_group] //layers added here are shown by default
}).setView([20, 0], 2);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var geocoder_options = {position: 'topright'};
var geocoder =  L.control.geocoder('search-daf-vyw', geocoder_options).addTo(map);

// this loads data into a leaflet layer
geoj.features.forEach(function(feat){
  // Assume each feature is a Multipoint geometry
  // (which is ordered Long,Lat. Leaflet expects Lat,Long
  var coords = feat.geometry.coordinates.map(function(p){return p.reverse();});
  
  // Skip route if any coordinate is null
  if(coords.reduce(function(notNull,coord){return notNull && coord != null;},true)){
    
    // Create layer group for a route.
    var route = L.featureGroup([L.marker(coords[0])]);
    for (var i = 1; i < coords.length; i ++){
      route.addLayer(L.polyline([coords[i-1],coords[i]]));
      route.addLayer(L.marker(coords[i]));
    }

    //Add route layer group to grouping of all non-user routes
    strangers_layer_group.addLayer(route);

  }
  
});
// Do initial animation:
//Snakein on each layer animates all at once
strangers_layer_group.eachLayer(function(x){x.snakeIn()});
//Snakein on the layergroup animates one at a time
//strangers_layer_group.snakeIn();

//Create leaflet control to toggle map layers
var baseMaps = {
  "strangers": strangers_layer_group,
  "none" : L.layerGroup()
};
var overlayMaps = {
  "confirmed": confirmed_pts,
  "submitted": user_layer_group
};
var overlayControl = L.control.layers(baseMaps,overlayMaps);
overlayControl.options.position = 'bottomright';
overlayControl.addTo(map);

//Gets new rows from the server and plots them.
//update_map executes periodically and indefinitely until server returns error
// It is also asynchronous, so control moves past this line
//update_map(); //commented out while backend is in flux

//commented out while front end is in flux
//document.getElementById("submit_button").addEventListener("click", post_array);


/* ************ FUNCTIONS *********** */

// Transform a GeoJSON string '{type:"Point",coordinates:[x,y]}'
//  into a leaflet LatLng object  */
function geoJSONToLLatLng(ptStr) {
  var p = JSON.parse(ptStr);
  return new L.LatLng(p.coordinates[1],p.coordinates[0]);
}

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

//Handle user clicking 'Confirm' button.
function confirmCoord(coordPair) {
  
    //Show confirmation
    var confirmation_msg = document.createElement('div');
    confirmation_msg.innerHTML = "Point Added. <br />";
    var confirmed_mark = L.marker(coordPair).bindPopup(confirmation_msg);
    confirmed_pts.addLayer(confirmed_mark);

    if (allowSubmit()){
      addSubmitBtn(confirmed_mark);
    }

    confirmed_mark.openPopup();
}

function addSubmitBtn(confirmed_mark){
  var submitBtn = document.createElement('a');
  submitBtn.className = "btn btn-default";
  submitBtn.innerHTML = "Submit";
  submitBtn.addEventListener('click',function(){
    //Prevent doubletap
    map.closePopup();
    submit();
  });
  confirmed_mark.getPopup().getContent().appendChild(submitBtn);
}

function allowSubmit(){
  return confirmed_pts.getLayers().length >= 2;
}

function submit(){  
  // Collect points into path and animate
  var latlngs = confirmed_pts.getLayers().map(function(d){return d.getLatLng();});
  var confirmed_poly = L.polyline(latlngs,{color:"yellow",snakingSpeed:200});
  user_layer_group.addLayer(confirmed_poly);
  confirmed_poly.snakeIn();

  // Transfer markers to submitted group
  // Redraw submitted markers to keep them visible after clearing confirmed pts
  var tmp_markers = confirmed_pts.getLayers();
  confirmed_pts.clearLayers();
  tmp_markers.forEach(function(x){user_layer_group.addLayer(x);});

  post_array();
}


function post_array() {
      
  // Transform markers into array of [x,y]
  var latlngs = confirmed_pts.getLayers().map(function(d){
   var latlng = d.getLatLng();
   return [latlng.lng,latlng.lat];
  });
  

  $.ajax({
    type : "POST",
    url : "/user_layer_group",
    data: JSON.stringify(user_layer_group.toGeoJSON()),
    contentType: 'application/json',
    success: function(result) {
      console.log("success");
    },
    error: function (error) {
      console.log("error: " + eval(error));
    }
  });
};

