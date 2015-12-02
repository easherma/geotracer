/* ************ MAIN ************ */

// Declare global variables
var UPDATE_INTERVAL = 30000; //unis of ms
var geocoderResults; //Referenced in Pelias js 
var biggerLine = {weight:6,lineCap:'butt'};
var normalLine = {weight:2.4,lineCap:'butt'};
var title = "Title"

//Create groupings for user-submitted results.
//We will add points to this group as they are geocoded & confirmed by user.
var confirmed_pts = L.layerGroup();
//We will add points to this group as they are submitted.
var user_layer_group = L.layerGroup();

//Create grouping of all paths.
//We will add paths to the group as they are retrieved from the db.
var all_layer_group = L.featureGroup()
    .bindPopup(''+ JSON.parse(geoj).features[0].properties.pelias_label)
    .on('mouseover', function() { all_layer_group.setStyle(biggerLine) })
    .on('mouseout', function() { all_layer_group.setStyle( normalLine ) }); 


// Show the whole world in this first view.
var map = L.map('map', {
  bounceAtZoomLimits: true,
  maxBounds: [[-85.0, -180.0],[85.0, 180.0]],
  inertia: false,
  minZoom: 2,
  continuousWorld: false,
  layers: [confirmed_pts,user_layer_group,all_layer_group] //layers added here are shown by default
}).setView([20, 0], 2);
L.tileLayer('https://a.tiles.mapbox.com/v3/mapbox.world-bright/{z}/{x}/{y}.png').addTo(map);

var geocoder_options = {position: 'topright', placeholder: 'Enter your points here!', title: 'Enter your points here!'};
var geocoder =  L.control.geocoder('search-daf-vyw', geocoder_options).addTo(map);

// Create one form instance for entering story-specific notes.
// The form will sit on the bottom left of the map.
// We will show/hide the form and clear its text as needed
// instead of discarding & creating a new instance for each submission.
var NotesControlClass = L.Control.extend(noteForm({isPopup:false})); 
var notesControl = new NotesControlClass;
map.addControl(notesControl);

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

//move pelias to dialog box, disabled for now until UI is redone
/*
$(function() {
    var $control = $(".leaflet-pelias-control");
    $control.prependTo("#input").css("color", "black");
});
*/

/* ************ FUNCTIONS *********** */


//random colors
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 14)];
    }
    return color;
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
/*function single_drawMultipoints(multipoints,places,layer,bring_to_back){

  multipoints.forEach(function(mp,i){
    // Transform coordinate pairs from Lng,Lat to Lat,Lng
    var coords = mp.geometry.coordinates.map(function(p){return p.reverse();});

    // Reverse coordinates and places so animation happens in chronological order
    coords.reverse();
    places[i].reverse();
	color = getRandomColor()

    // Transform multipoint to featuregroup of alternating points and line segments. style 
    var firstMarker = L.circleMarker(coords[0],{color: color, radius:2,}, {title:places[i][0].place,note:places[i][0].note});
	map.eachLayer(function (layer) {
    layer.bindPopup('Hello');
});


    (function(layer){
      layer.on('mouseover',function(e){addTooltip(e,{'type':'place','txt':layer.options.title});});
      layer.on('mouseout',function(e){removeTooltip({'type':'place'})});
    })(firstMarker);
	var plabel = places[i][0].place
	var popup = L.popup()
    .setLatLng(coords[0])
    .setContent(plabel)
    .addTo(map);
    var route = L.featureGroup([firstMarker]);
    for (var j = 1; j < coords.length; j ++){
      var poly = L.polyline([coords[j-1],coords[j]], {color: color});
	  
      (function(layer){
        layer.on('mouseover',function(e){
          layer.setStyle(biggerLine);
          addTooltip(e,{'type':'note','grandlayergroup':all_layer_group,'thislayer':layer});
        });
        layer.on('mouseout',function(){
          layer.setStyle(normalLine);
          removeTooltip({'type':'note'});
        });
      })(poly);
      route.addLayer(poly)
      var nextMarker = L.circleMarker(coords[j],{color: color, radius:2,},{radius:.2,title:places[i][j].place,note:places[i][j].note});
	var plabel1 = places[i][j].place
	var popup1 = L.popup()
		.setLatLng(coords[j])
		.setContent(plabel1)
		.addTo(map);

      (function(layer){
        layer.on('mouseover',function(e){addTooltip(e,{'type':'place','txt':layer.options.title});});
        layer.on('mouseout',function(e){removeTooltip({'type':'place'})});
      })(nextMarker);
      route.addLayer(nextMarker);
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
*/

function drawMultipoints(multipoints,places,layer,bring_to_back){

  multipoints.forEach(function(mp,i){
    // Transform coordinate pairs from Lng,Lat to Lat,Lng
    var coords = mp.geometry.coordinates.map(function(p){return p.reverse();});
	color = getRandomColor()
    // Reverse coordinates and places so animation happens in chronological order
    coords.reverse();
    places[i].reverse();

    // Transform multipoint to featuregroup of alternating points and line segments.
    var firstMarker = L.circleMarker(coords[0],{radius:2,color:color, opacity: 0});
    (function(layer){
      layer.on('mouseover',function(e){addTooltip(e,{'type':'place','txt':layer.options.title});});
      layer.on('mouseout',function(e){removeTooltip({'type':'place'})});
    })(firstMarker);
    /* label pop-ups
    var plabel = places[i][0].place
	var popup = L.popup()
    .setLatLng(coords[0])
    .setContent(plabel)
    .addTo(map); */
    var route = L.featureGroup([firstMarker]);
    for (var j = 1; j < coords.length; j ++){
      var poly = L.polyline([coords[j-1],coords[j]], {color:color, opacity: j * .2 , weight: j * 1.5 });
        (poly);
      route.addLayer(poly)
      var nextMarker = L.circleMarker(coords[j],{radius:j * 1.2,color:color,opacity: j * .2});
      (function(layer){
        layer.on('mouseover',function(e) {
		e.layer.openPopup();
		});
    /*label popups
    var plabel1 = places[i][j].place
	var popup1 = L.popup()
		.setLatLng(coords[j])
		.setContent(plabel1)
		.addTo(map);
	*/	
		//{addTooltip(e,{'type':'place','txt':layer.options.title});});
        layer.on('mouseout',function(e){removeTooltip({'type':'place'})});
      })(nextMarker);
      route.addLayer(nextMarker);
    }
      
    // Add featuregroup to specified layer
    layer.addLayer(route);

    if (bring_to_back) {
      // Send layer group to bottom. And don't animate (which brings it to fore.)
      layer.bringToBack();
    } else {
      // Run animation on the new route
	  map.fitBounds(all_layer_group.getBounds(),{
	  padding: [25,25]});
      route.snakeIn();
    }
  });
}



//Handle user clicking 'Confirm' button.
function confirmCoord(coordPair,place) {

  //Show confirmation
  var confirmation_msg = document.createElement('div');
  if (allowSubmit()){
    confirmation_msg.innerHTML = "<strong>Point Added.</strong><br>";
  } else {
    confirmation_msg.innerHTML = "<strong>Point Added.</strong><br>";
  }
  // Add tooltip to marker showing placename.
  var markerTitle = place.name + "," + place.region + "," + place.country;
  var markerOptions = {
    title :markerTitle,
    radius : 7,
    color : 'yellow',
    note : noteForm({isPopup:true})
  };
  var confirmed_mark = L.circleMarker(coordPair,markerOptions).bindPopup(confirmation_msg);
  confirmed_pts.addLayer(confirmed_mark);
  
  addNext(confirmed_mark);
  addClearThisBtn(confirmed_mark);
  addClearAllBtn(confirmed_mark);
  addNoteBtn(confirmed_mark);
  addNoteFormMarkup(confirmed_mark); 
  geocoder.marker.unbindPopup();

  if (allowSubmit()){
    addSubmitBtn(confirmed_mark);
  }

  setTimeout(function(){confirmed_mark.openPopup();},350);
}

function addClearThisBtn(confirmed_mark){
  var oldPopup = geocoder.marker.getPopup().getContent();
  var clearBtn = document.createElement('button');
  var confirmedLatLng = confirmed_mark.getLatLng();
  clearBtn.id = "clearOne";
  clearBtn.className = "btn btn-dark btn-sm";
  clearBtn.innerHTML = "Clear this point";
  clearBtn.addEventListener('click',function(){
    //Prevent doubletap
    map.closePopup();
    clearThis(confirmed_mark);
    if (confirmedLatLng.lat === geocoder.marker.getLatLng().lat 
      && confirmedLatLng.lng === geocoder.marker.getLatLng().lng){    
        geocoder.marker.bindPopup(oldPopup);
      }
  });
  confirmed_mark.getPopup().getContent().appendChild(clearBtn);
}

function clearThis(marker){
  confirmed_pts.removeLayer(marker); 
}

function addClearAllBtn(confirmed_mark){
  var oldPopup = geocoder.marker.getPopup().getContent();
  var clearBtn = document.createElement('button');
  var confirmedLatLng = confirmed_mark.getLatLng();
  clearBtn.id = "clearAll";
  clearBtn.className = "btn btn-dark btn-sm";
  clearBtn.innerHTML = "Clear all points";
  clearBtn.addEventListener('click',function(){
    //Prevent doubletap
    map.closePopup();
    clearAll();
    if (confirmedLatLng.lat === geocoder.marker.getLatLng().lat 
      && confirmedLatLng.lng === geocoder.marker.getLatLng().lng){    
        geocoder.marker.bindPopup(oldPopup);
      }
  });
  confirmed_mark.getPopup().getContent().appendChild(clearBtn);
}

function addNext(confirmed_mark){
  var oldPopup = geocoder.marker.getPopup().getContent();
  var clearBtn = document.createElement('button');
  var confirmedLatLng = confirmed_mark.getLatLng();
  clearBtn.id = "next";
  clearBtn.className = "btn btn-dark btn-sm";
  clearBtn.innerHTML = "Enter More Points";
  clearBtn.addEventListener('click',function(){
    //Prevent doubletap
    map.closePopup();
    geocoder.resetInput();
    $('html, body').animate({
    scrollTop: $(".leaflet-pelias-control").offset().top
}, 1000);
    
  });
  confirmed_mark.getPopup().getContent().appendChild(clearBtn);
} 

function addNoteBtn(confirmed_mark){
  var noteBtn = document.createElement('button');
  noteBtn.id = "notes";
  noteBtn.className = "btn btn-dark btn-sm";
  noteBtn.innerHTML = "Add Note";
  noteBtn.addEventListener('click',function(){
    $(event.target).next('hr').removeClass('hide');
    confirmed_mark.options.note.show();
  });
  confirmed_mark.getPopup().getContent().appendChild(noteBtn);
} 

function addNoteFormMarkup(confirmed_mark){
  var hiddenNoteForm = confirmed_mark.options.note.markup;
  var rule = document.createElement('hr');
  rule.className = "hide";
  confirmed_mark.getPopup().getContent().appendChild(rule);
  confirmed_mark.getPopup().getContent().appendChild(hiddenNoteForm);
}

function clearAll(){
  confirmed_pts.clearLayers(); 
}

function addSubmitBtn(confirmed_mark){
  var submitBtn = document.createElement('a');
  submitBtn.className = "btn btn-dark btn-sm";
  submitBtn.innerHTML = "Submit My Story";
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
  notesControl.show();
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
    var confirmed_poly = L.polyline(latlngs,{color:"yellow",snakingSpeed:400});
    // For setting hover styles, auto-invoked function recommended by:
    // http://palewi.re/posts/2012/03/26/leaflet-recipe-hover-events-features-and-polygons/ 
    (function(layer,noteText){
      layer.on('mouseover',function(e){
        layer.setStyle(biggerLine);
        addTooltip(e,{'type':'note','txt':noteText});
      });
      layer.on('mouseout',function(){
        layer.setStyle(normalLine);
        removeTooltip({'type':'note'});
      });
    })(confirmed_poly,notesControl.getNote());
    user_layer_group.addLayer(confirmed_poly);
    confirmed_poly.snakeIn();

    // Transfer markers to submitted group
    // Redraw submitted markers to keep them visible after clearing confirmed pts
    var tmp_markers = confirmed_pts.getLayers();
    confirmed_pts.clearLayers();
    tmp_markers.forEach(function(x){
      user_layer_group.addLayer(x);
      (function(layer){
        layer.on('mouseover',function(e){
          addTooltip(e,{
            'type':'place',
            'txt':layer.options.title + '\n' + layer.options.note.getNote()});});
        layer.on('mouseout',function(e){removeTooltip({'type':'place'})});
      })(x);
    });

    notesControl.clear();
    notesControl.hide();
  }

}


function post() {
      
  var geoJ = confirmed_pts.toGeoJSON();
 
  // Add path-specific note arbitrarily to first geojson feature
  geoJ.features[0].properties['pathnote'] = notesControl.getNote();

  // Retrieve location-specific notes from markers and add to geoJSON
  var placeNotes = confirmed_pts.getLayers().map(function(d){
    return d.options.note.getNote();
  });
  geoJ.features.forEach(function(feat,i){
    feat.properties['placenote'] = placeNotes[i];
  });

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

function htmlEncode(unsafeString){
  return $("<div/>").text(unsafeString).html();
};

// Show tooltip for note or placename
function addTooltip(evnt,arg){
  var unsafeText = "";

  if (arg.hasOwnProperty('txt')){
    //Already have the text
    unsafeText = arg.txt;
  } else {
    //Only know the layer that's being interacted with
    //and a guess as to which group it might belong to
    //Find this layer's siblings,one of which might hold the note
    var layerOwner;
    var pathGrandLayerGroup = arg.grandlayergroup;
    var thisLayer = arg.thislayer;
    pathGrandLayerGroup.eachLayer(function(x){ if (x.hasLayer(thisLayer)){ layerOwner = x;}});
    // Concatenate notes from along the path
    layerOwner.eachLayer(function(x){unsafeText += (x.options.note || "");});
  }

  // The text came straight from the db but was originally supplied by the client.
  // Best to encode it before inserting into DOM.
  var safeText = htmlEncode(unsafeText);
  // Create the tooltip. Leaflet directly styles the divIcon,
  // but we can style the inner div with CSS
  var classNm = arg.type === 'note' ? 'note-tooltip' : 'place-tooltip';
  var tt = L.divIcon({className:classNm,html:"<div>"+safeText+"</div>"});
  // Not every user will enter a note, so only add marker to map if text is non-empty 
  if (safeText) L.marker(evnt.latlng,{icon:tt}).addTo(map);
};

//Find the tooltip and remove it
function removeTooltip(arg){
  var tt;
  var classNm = arg.type === 'note' ? 'note-tooltip' : 'place-tooltip';
  map.eachLayer(function(x){ if (x.options.icon && x.options.icon.options.className === classNm){tt = x;}});
  if (tt) map.removeLayer(tt);
};
