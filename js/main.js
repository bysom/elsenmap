var map = L.map('map').setView([50.5, 10], 6);
var kalData = []
var places = []

L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="http://mapquest.com">MapQuest</a>'
}).addTo(map);

//Die Adressen von Elsen sind etwas schräg formattiert
function repairElsensAdresses(murks){
	var str = murks.split(",")
	re = /[\d]+/
	for (var i = 0; i < str.length; i++) {
		str[i] = str[i].trim()
		//Wenn keine Zahl in der ersten Adress-Zeile, mache die erste Zeile fett
		if (i == 0 && !re.test(str[i])){
			str[i] = "<strong>"+str[i]+"</strong>"
		}
	};
	return str.join("<br>")
}

function onEachFeature(feature, layer) {
	var popupContent = "<h4>" +
			feature.properties.name + "</h4>";
	if(feature.properties.dates){
		popupContent += "<adresse>"+repairElsensAdresses(feature.properties.dates[0].place)+"</adresse>"

	}

	// popupContent += "<p>" +
	// 		feature.properties.dates[0].start.toLocaleString() + "</p>";
	console.log("ffffft")
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

// Veranstaltungsobjekt
function getEventObj(row){
	var hash = md5(row[0])
	var placehash = md5(row[6])
	return {
		start: buildTime(row[1],row[2],row[3],row[4])
		, end: buildTime(row[1],row[2],row[3],row[5])
		, place: row[6]
		, type: row[7]
		, desc: row[8]
		, hash: hash
		, placehash: placehash
	}
}

// Die Geodaten laden
$.getJSON( "data/standorte.geojson", function( data ) {
	places = data.features
	kalData = []
	var re = /<tr>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+">([\d]{1,2}).([\d]{1,2}).([\d]{2,4})[\w&;<>\/]+\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+">([\w:&;]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;., \-äöüÄÖÜß\/<>@+\(\)'=]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;., \-äöüÄÖÜß\/<>@+\(\)'=]*)<\/td>\n[ ]*<td class="kal[\w]+"[\w ="\-:;><\/.?&]+>([\w:&;., \-äöüÄÖÜß\/<>@+\(\)?'"=]*)<\/td>\n/gi;
	$.get('data/kalender.html', function(data2) {
		//Geodaten um Veranstaltungen erweitern
	    while(row = re.exec(data2)){
	    	var cvent = getEventObj(row)
	    	var placehash = md5(row[6])
	    	console.log(row[6])
	    	kalData.push(cvent)
	    	for (var i = 0; i < places.length; i++) {
	    		if(places[i].properties.hashes.indexOf(placehash) >= 0){
	    			if(places[i].properties.dates == null){
	    				places[i].properties.dates = []
	    			}
	    			places[i].properties.dates.push(cvent)
	    		}
	    	};
	    }
	    //Jetzt die Geodaten in die Karte packen
	    console.log("pfrrt")
	    L.geoJson(data, {
			// style: function (feature) {
			// 	return feature.properties && feature.properties.style;
			// },

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
