var map = L.map('map').setView([50.5, 10], 6);

L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="http://mapquest.com">MapQuest</a>'
}).addTo(map);


function onEachFeature(feature, layer) {
	var popupContent = "<p>" +
			feature.properties.name + "</p>";

	if (feature.properties && feature.properties.popupContent) {
		popupContent += feature.properties.popupContent;
	}

	layer.bindPopup(popupContent);
}

function getColor(prevented){
	if(prevented){
		return "#00FF00"
	}
	else{
		return "#FF0000"
	}
}

$.getJSON( "data/standorte.geojson", function( data ) {
	L.geoJson(data, {

		style: function (feature) {
			return feature.properties && feature.properties.style;
		},

		onEachFeature: onEachFeature,

		pointToLayer: function (feature, latlng) {
			return L.circleMarker(latlng, {
				radius: 8,
				fillColor: getColor(feature.properties.prevented),
				color: "#000",
				weight: 1,
				opacity: 1,
				fillOpacity: 0.8
			});
		}
	}).addTo(map);
});
