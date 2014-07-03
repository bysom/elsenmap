var map = L.map('map').setView([50.5, 10], 6);
var kalData = []
var places = []

L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="http://mapquest.com">MapQuest</a>'
}).addTo(map);


function onEachFeature(feature, layer) {
	var popupContent = "<p>" +
			feature.properties.name + "</p>";
	// popupContent += "<p>" +
	// 		feature.properties.dates[0].start.toLocaleString() + "</p>";
	// if (feature.properties && feature.properties.popupContent) {
	// 	popupContent += feature.properties.popupContent;
	// }

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

function buildTime(day, month, year, time){
	if(!day || !month || !year || !time || time.indexOf("&nbsp;") >= 0)
		return false
	re = /([\d]{1,2}):([\d]{1,2})/gi;
	time = re.exec(time)
	return new Date(year, month-1, day, time[1], time[2], 0, 0);

}

// Die Geodaten laden
$.getJSON( "data/standorte.geojson", function( data ) {
	places = data.features
	kalData = []
	var re = /<tr>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+">([\d]{1,2}).([\d]{1,2}).([\d]{2,4})[\w&;<>\/]+\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+">([\w:&;]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;., \-äöüÄÖÜß\/<>@+\(\)'=]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;., \-äöüÄÖÜß\/<>@+\(\)'=]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;., \-äöüÄÖÜß\/<>@+\(\)?'"=]*)<\/td>\n/gi;
	$.get('data/kalender.html', function(data2) {
	    while(row = re.exec(data2)){
	    	var hash = md5(row[0])
	    	var placehash = md5(row[6])
	    	kalData.push({
	    		start: buildTime(row[1],row[2],row[3],row[4])
	    		, end: buildTime(row[1],row[2],row[3],row[5])
	    		, place: row[6]
	    		, type: row[7]
	    		, desc: row[8]
	    		, hash: hash
	    		, placehash: placehash
	    	})
	    	for (var i = 0; i < places.length; i++) {
	    		if(places[i].properties.hashes.indexOf(placehash) >= 0){
	    			if(places[i].properties.dates == null){
	    				places[i].properties.dates = []
	    			}
	    			places[i].properties.dates.push({
	    				start: buildTime(row[1],row[2],row[3],row[4])
			    		, end: buildTime(row[1],row[2],row[3],row[5])
			    		, place: row[6]
			    		, type: row[7]
			    		, desc: row[8]
			    		, hash: hash
			    		, placehash: placehash
	    			})
	    		}
	    	};
	    }
	    //Jetzt die Geodaten in die Karte packen
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
	
});
