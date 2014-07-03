var map = L.map('map').setView([50.5, 10], 6);
var kalData = []
var places = []
var now = new Date()

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
		popupContent += "<dl><dt>Start:</dt><dd>"+feature.properties.minstart.toLocaleString()+"</dd><dt>Frühestes Ende:</dt><dd>"+feature.properties.maxend.toLocaleString()+"</dt></dl>"

		//Die Veranstaltungen
		popupContent += "<div class=\"table-responsive\"><table class=\"table\">"
		for (var i = 0; i < feature.properties.dates.length; i++) {
			var end = "";
			if (feature.properties.dates[i].end) {
				end = " bis "+feature.properties.dates[i].end.toLocaleTimeString()
			};
			popupContent += "<tr><td>"+feature.properties.dates[i].start.toLocaleDateString()+"</td><td>"+feature.properties.dates[i].start.toLocaleTimeString()+end+"</td><td>"+feature.properties.dates[i].type+"</td></tr>"
		};
		popupContent += "</table></div>"

		popupContent += "<address>"+repairElsensAdresses(feature.properties.dates[0].place)+"</address>"
		if (feature.properties.dates[0].desc && feature.properties.dates[0].desc != "&nbsp;") {
			popupContent += "<p class=\"text-muted\"><em>"+feature.properties.dates[0].desc+"</em></p>"
		};
	}


	// popupContent += "<p>" +
	// 		feature.properties.dates[0].start.toLocaleString() + "</p>";
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
	$.ajax({
		url: 'data/kalender.html'
		, beforeSend: function(jqXHR) {
	        jqXHR.overrideMimeType('text/html;charset=iso-8859-1');
	    }
	}).done(function(data2) {
		//Geodaten um Veranstaltungen erweitern
	    while(row = re.exec(data2)){
	    	var cvent = getEventObj(row)
	    	var placehash = md5(row[6])
	    	kalData.push(cvent)
	    	for (var i = 0; i < places.length; i++) {
	    		if(places[i].properties.hashes.indexOf(placehash) >= 0){
	    			if(places[i].properties.dates == null){
	    				places[i].properties.dates = []
	    			}
	    			places[i].properties.dates.push(cvent)

	    			//Anfang + Ender aller Veranstaltungen dort
	    			if(places[i].properties.minstart == null || places[i].properties.minstart > buildTime(row[1],row[2],row[3],row[4]))
    					places[i].properties.minstart = buildTime(row[1],row[2],row[3],row[4])

    				var end = buildTime(row[1],row[2],row[3],row[5])
    				var bigger = (places[i].properties.maxend == null || places[i].properties.maxend < end)
					if(end){
						if (bigger){
							places[i].properties.maxend = end
						}
					}
					else{
						if (bigger){
							places[i].properties.maxend = buildTime(row[1],row[2],row[3],row[4])
						}
					}
	    		}
	    	};
	    }
	    //Jetzt die Geodaten in die Karte packen
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
