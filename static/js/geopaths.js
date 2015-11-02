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
drawMultipoints(JSON.parse(geoj).features,geoplaces,strangers_layer_group);

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
update_map();

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
      // Set current row
      prevRowId = result.lastrowid;

      drawMultipoints(result.multipoints.features,result.places,strangers_layer_group);

      setTimeout(update_map,UPDATE_INTERVAL);
    },
    error : function(error) {
      console.log("error: " + error);
    }
  });
}

// Add array of Multipoint geoJSON features to a layer and animate.
function drawMultipoints(multipoints,places,layer){

  multipoints.forEach(function(mp,i){
    //Reverse coordinates from Lng,Lat to Lat,Lng
    var coords = mp.geometry.coordinates.map(function(p){return p.reverse();});

    // Transform multipoint to featuregroup of alternating points and line segments.
    var route = L.featureGroup([L.marker(coords[0],{title:places[i][0].place})]);
    for (var j = 1; j < coords.length; j ++){
      route.addLayer(L.polyline([coords[j-1],coords[j]]));
      route.addLayer(L.marker(coords[j],{title:places[i][j].place}));
    }
      
    // Add featuregroup to specified layer
    layer.addLayer(route);

    // Run animation on the new route
    route.snakeIn();

  });
}

//Handle user clicking 'Confirm' button.
function confirmCoord(coordPair,place) {
  
    //Show confirmation
    var confirmation_msg = document.createElement('div');
    confirmation_msg.innerHTML = "Point Added. <br />";
    // Add tooltip to marker showing placename.
    var markerTitle = place.name + "," + place.region + "," + place.country;
    var confirmed_mark = L.marker(coordPair,{title:markerTitle}).bindPopup(confirmation_msg);
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
  post_array();
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

}


function post_array() {
      
  var geoJ = confirmed_pts.toGeoJSON();

  // Parse titles from markers and add to geoJSON representation
  var titles = confirmed_pts.getLayers().map(function(d){
   return d.options.title;
  }); 
  geoJ.features.forEach(function(feat,i){
    feat.properties['place'] = titles[i];
  });
  

  $.ajax({
    type : "POST",
    url : "/geo",
    data: JSON.stringify(geoJ),
    contentType: 'application/json',
    success: function(result) {
      console.log("success");
    },
    error: function (error) {
      console.log("error: " + eval(error));
    }
  });
};

