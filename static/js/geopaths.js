/* ************ MAIN ************ */

// Declare global variables
var UPDATE_INTERVAL = 30000; //unis of ms
var geocoderResults; //Referenced in Pelias js 

//Create groupings for user-submitted results.
//We will add points to this group as they are geocoded & confirmed by user.
var confirmed_pts = L.layerGroup();
//We will add points to this group as they are submitted.
var user_layer_group = L.layerGroup();

//Create grouping of all paths.
//We will add paths to the group as they are retrieved from the db.
var all_layer_group = L.featureGroup();

// Show the whole world in this first view.
var map = L.map('map', {
  bounceAtZoomLimits: true,
  maxBounds: [[-85.0, -180.0],[85.0, 180.0]],
  inertia: false,
  minZoom: 2,
  continuousWorld: false,
  layers: [confirmed_pts,user_layer_group,all_layer_group] //layers added here are shown by default
}).setView([20, 0], 2);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var geocoder_options = {position: 'topright',expanded: 'true'};
var geocoder =  L.control.geocoder('search-daf-vyw', geocoder_options).addTo(map);

// Create one form for entering notes. We will show/hide the form and clear its text as needed.
var notesBoxControl = L.Control.extend({
    options: {
      position: 'bottomleft'
    },
    onAdd: function(map){
      this.container = $('<div/>')
        .attr('id','note-form')
        .addClass('hide')
        .html("If you'd like, add a few words about this history...")
        .on('click',function(e){
          // Allows markers to stay open and user to interact with both layers.
          L.DomEvent.stopPropagation(e);
         })
        .append(
          $('<textarea/>')
         )
        .append(
          $('<i/>')
            .addClass('fa fa-3x fa-check-circle')
            .on('click',function(e){e.target.parentElement.classList.add('hide');})
         )
        .append(
          $('<i/>')
            .addClass('fa fa-3x fa-times-circle')
            .on('click',function(e){
              e.target.parentElement.classList.add('hide');
              $(e.target.parentElement).find('textarea').val("");
            })
         )
      return this.container.get(0);
    },
    show: function(){
      this.container.removeClass('hide');
    },
    hide: function(){
      this.container.addClass('hide');
    },
    clear: function(){
      this.container.find('textarea').val("");
    },
    getNote: function(){
      return this.container.find('textarea').val();
    }
});
var notesBox = new notesBoxControl();
map.addControl(notesBox);

// this loads data into a leaflet layer
drawMultipoints(JSON.parse(geoj).features,geoplaces,all_layer_group,false);

//Create leaflet control to toggle map layers
var baseMaps = {
  "all": all_layer_group,
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

      // Call with bring_to_back:=true so updates which may contain user paths dont draw over user paths.
      drawMultipoints(result.multipoints.features,result.places,all_layer_group,true);

      setTimeout(update_map,UPDATE_INTERVAL);
    },
    error : function(error) {
      console.log("error: " + error);
    }
  });
}

// Add array of Multipoint geoJSON features to a layer and animate.
// Each multipoint represents a different 'story' line
function drawMultipoints(multipoints,places,layer,bring_to_back){

  multipoints.forEach(function(mp,i){
    // Transform coordinate pairs from Lng,Lat to Lat,Lng
    var coords = mp.geometry.coordinates.map(function(p){return p.reverse();});

    // Reverse coordinates and places so animation happens in chronological order
    coords.reverse();
    places[i].reverse();

    // Transform multipoint to featuregroup of alternating points and line segments.
    var route = L.featureGroup([L.marker(coords[0],{title:places[i][0].place})]);
    for (var j = 1; j < coords.length; j ++){
      route.addLayer(L.polyline([coords[j-1],coords[j]]));
      route.addLayer(L.marker(coords[j],{title:places[i][j].place}));
    }
      
    // Add featuregroup to specified layer
    layer.addLayer(route);

    if (bring_to_back) {
      // Send layer group to bottom. And don't animate (which brings it to fore.)
      layer.bringToBack();
    } else {
      // Run animation on the new route
      route.snakeIn();
    }
  });
}

//Handle user clicking 'Confirm' button.
function confirmCoord(coordPair,place) {

  //Show confirmation
  var confirmation_msg = document.createElement('div');
  if (allowSubmit()){
    confirmation_msg.innerHTML = "<strong>Point Added.</strong><br />";
  } else {
    confirmation_msg.innerHTML = "<strong>Point Added.</strong> If you made a mistake, <wbr> you may choose an option below.<br />";
  }
  // Add tooltip to marker showing placename.
  var markerTitle = place.name + "," + place.region + "," + place.country;
  var confirmed_mark = L.marker(coordPair,{title:markerTitle}).bindPopup(confirmation_msg);
  confirmed_pts.addLayer(confirmed_mark);

  addClearThisBtn(confirmed_mark);
  addClearAllBtn(confirmed_mark);
  
  if (allowSubmit()){
    addSubmitBtn(confirmed_mark);
  }

  setTimeout(function(){confirmed_mark.openPopup();},350);
}

function addClearThisBtn(confirmed_mark){
  var clearBtn = document.createElement('button');
  clearBtn.className = "btn btn-default btn-sm";
  clearBtn.innerHTML = "Clear this point";
  clearBtn.addEventListener('click',function(){
    //Prevent doubletap
    map.closePopup();
    clearThis(confirmed_mark);
  });
  confirmed_mark.getPopup().getContent().appendChild(clearBtn);
}

function clearThis(marker){
  confirmed_pts.removeLayer(marker); 
}

function addClearAllBtn(confirmed_mark){
  var clearBtn = document.createElement('button');
  clearBtn.className = "btn btn-default btn-sm";
  clearBtn.innerHTML = "Clear all points";
  clearBtn.addEventListener('click',function(){
    //Prevent doubletap
    map.closePopup();
    clearAll();
  });
  confirmed_mark.getPopup().getContent().appendChild(clearBtn);
}

function clearAll(){
  confirmed_pts.clearLayers(); 
}

function addSubmitBtn(confirmed_mark){
  var submitBtn = document.createElement('a');
  submitBtn.className = "btn btn-default";
  submitBtn.innerHTML = "Submit";
  submitBtn.addEventListener('click',function(){
    //Prevent doubletap
    map.closePopup();
    showReadyToSubmit(confirmed_mark);
  });
  confirmed_mark.getPopup().getContent().appendChild(submitBtn);
}

function allowSubmit(){
  return confirmed_pts.getLayers().length >= 2;
}

function showReadyToSubmit(marker){
  //Show 'Are you sure you want to submit'
  var confirmation_msg = document.createElement('div');
  confirmation_msg.innerHTML = "Are you finished adding <wbr>points to this history?<br />";
  //'Yes' option adds a form to let the user input notes
  notesBox.show();
  confirmation_msg.innerHTML += "<button class='btn btn-default' onclick=submit()>Yes</button>";
  //'No' option re-binds previous popup message to the marker.
  var noBtn = document.createElement('div');
  noBtn.className = 'btn btn-default';
  noBtn.innerText = "No";
  var oldPopup = marker.getPopup().getContent();
  noBtn.addEventListener('click',function(){
    map.closePopup();
    marker.unbindPopup().bindPopup(oldPopup);
  });
  confirmation_msg.appendChild(noBtn);
  marker.unbindPopup().bindPopup(confirmation_msg).openPopup(); 
}

function submit(){  

  // Doublecheck that there is enough to submit
  if (allowSubmit()){

    post();
    // Collect points into path and animate
    var latlngs = confirmed_pts.getLayers().reverse().map(function(d){return d.getLatLng();});
    var confirmed_poly = L.polyline(latlngs,{color:"yellow",snakingSpeed:200});
    user_layer_group.addLayer(confirmed_poly);
    confirmed_poly.snakeIn();

    // Transfer markers to submitted group
    // Redraw submitted markers to keep them visible after clearing confirmed pts
    var tmp_markers = confirmed_pts.getLayers();
    confirmed_pts.clearLayers();
    tmp_markers.forEach(function(x){user_layer_group.addLayer(x);});

    notesBox.clear();
    notesBox.hide();
  }

}


function post() {
      
  var geoJ = confirmed_pts.toGeoJSON();
 
  // Add free-form note arbitrarily to first geojson feature
  geoJ.features[0].properties['note'] = notesBox.getNote();

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

