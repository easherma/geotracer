function revealTextarea(id, placeholderText){
	var placeholder = placeholderText || "Enter a note here.";
	document.getElementById(id).value = placeholder;
	$('#' + id).addClass('visible');
}

function addTextToPoint(coordPair, place){
	console.log("PLACE:");
	console.log(place);
	revealTextarea('text-map-addition');
}

console.log("LOADED map-ui-scripts.js");