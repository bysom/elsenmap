var map = L.map('map').setView([50.5, 10], 6);
var kalData = []
var places = []
var now = new Date()
var aufsUrheberrechtScheissen = false
var cElsen = ""
var errors = []
var tmpHashes = []

if (aufsUrheberrechtScheissen){
	cElsen = ', Veranstaltungsinfos sind von der Website von <a target="_blank" href="http://www.dr-elsen-veranstaltung.de/predigten/veranstaltungskalender.php?kal_Start=1">Dr. Arne Elsen</a>'
	$("#crbla").html(" Die Informationen bezieht die Karte aus den von Dr. Arne Elsen <a href=\"http://www.dr-elsen-veranstaltung.de/predigten/veranstaltungskalender.php?kal_Start=1\" target=\"_blank\">veröffentlichten</a> Veranstaltungsterminen auf seiner Website.")
}
// L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
L.tileLayer('http://b.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="http://mapquest.com">MapQuest</a>' + cElsen
		
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
		popupContent += "<dl>"
		if (aufsUrheberrechtScheissen) {
			popupContent += "<dt>Start:</dt><dd>"+feature.properties.minstart.toLocaleString()+"</dd><dt>Frühestes Ende:</dt><dd>"+feature.properties.maxend.toLocaleString()+"</dt>"
		};
		popupContent += "<dt>Verbleibend:</dt><dd>"+feature.properties.left+" Tage</dd></dl>"

		if(aufsUrheberrechtScheissen){
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
	}


	// popupContent += "<p>" +
	// 		feature.properties.dates[0].start.toLocaleString() + "</p>";
	layer.bindPopup(popupContent);
	var labeltext = labelText(feature.properties.left)
	if(labeltext)
		layer.bindLabel(labeltext, { noHide: true })
}

function getColor(prevented, time){
	if(time > now){
		if(prevented){
			return "#CCFF33"
		}
		else{
			return "#C3C3C3"
		}
	}
	else
		return "#000"
}
function getBorderColor(prevented, time){
	if(time > now){
		if(prevented){
			return "#000"
		}
		else{
			return "#000"
		}
	}
	else
		if(prevented){
			return "#0F0"
		}
		else{
			return "#F00"
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
	tmpHashes.push(hash)
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

function labelText(left){
	if(left > 0){
		if(left <= 1)
			return "<strong>keine 24h mehr!</strong>"
		else if(left < 60){
			return "Noch "+left+" Tage"
		}
		else
			return false
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
	    			if(places[i].properties.minstart == null || places[i].properties.minstart > buildTime(row[1],row[2],row[3],row[4])){
    					places[i].properties.minstart = buildTime(row[1],row[2],row[3],row[4])
    					places[i].properties.left = Math.round((places[i].properties.minstart-now)/(1000*60*60*24)+0.5)
	    			}

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
				var fillOpacity = 0.9
				var radius = 8
				var weight = 2
				var opacity = 0.3
				if(feature.properties.minstart< now){
					fillOpacity = 0.6
					if (!feature.properties.prevented) {
						radius = 6
					};
				}
				else{
					radius = 10
					weight = 3
				}


				return L.circleMarker(latlng, {
					radius: radius,
					fillColor: getColor(feature.properties.prevented, feature.properties.minstart),
					color: getBorderColor(feature.properties.prevented, feature.properties.minstart),
					weight: weight,
					opacity: opacity,
					fillOpacity: fillOpacity
				});
			}
		}).addTo(map);

	    //Daten auf Veränderung checken anhand bekannter Hashes
	    $.getJSON('data/hashes.json', function(json, textStatus) {
	    	var usedHashes = []
	    	newerrors = []
	    	for (var i = 0; i < places.length; i++) {
	    		for (var j = 0; j < places[i].properties.dates.length; j++) {
	    			if(json.hashes.indexOf(places[i].properties.dates[j].hash) >= 0){
	    				usedHashes.push(places[i].properties.dates[j].hash)
	    			}
	    			else{
	    				newerrors.push(places[i].properties.dates[j].place)
	    			}
	    		};
	    		
	    	};
	    	if(newerrors.length > 0){
		    	var errobj = {
					type: "warning"
					, content: "Es gab Veränderungen, die noch nicht in die Karte eingepflegt wurden an den Orten <br><ul><li>"+newerrors.join("</li><li>")+"</li></ul>"
					, title: "Achtung!"
				}
				errors.push(errobj)
				$("#infoBox").html("<div class=\"alert alert-"+errobj.type+" alert-dismissable\" role=\"alert\"><button type=\"button\" class=\"close\" data-dismiss=\"alert\"><span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span></button><strong>"+errobj.title+"</strong> "+errobj.content+"</div>")
			}
	    });
	    
	});
	
});
