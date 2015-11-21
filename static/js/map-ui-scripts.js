function revealTextarea(divID, textID, placeholderText){
	var placeholder = placeholderText || "Enter a note here.";
	document.getElementById(textID).value = placeholder;
	$('#' + divID).addClass('visible');
}

function addTextToPoint(coordPair, place){
	console.log("PLACE:");
	console.log(place);
	var message = "Tell us more about " + place.name;
		message += ", " + place.region + ", " + place.country + "!";
	revealTextarea('note-submission', 'text-map-addition', message);
}

console.log("LOADED map-ui-scripts.js");