/**
 * @author Karsten Römke
 */
//also jquery mobile zwingend weiter unten
//globale Variablen
//design pattern to use own object for this Application
//habe ich noch nicht ganz verstanden, man koennte das veloStat Objekt
//doch auch ohne anonyme Funktion aufbauen, dann ist aber eine
//menge oeffentlich, mit dem Pattern kann man die Sichtbarkeit nach
//aussen reduzieren, nur was veloStat zugewiesen wird, bleibt
//nach aussen sichtbar - mit einem new und einem normalen Objekt wäre das aber auch
//moeglich, hier wird sowas wie ein Singleton-Pattern gebaut

//$(document).ready wird nach pagecreate gerufen - das bringt auch nix zum initialisieren
//$(document).ready() nicht fuer mobile (ajax-navigation), also hier schon, multiple pages
// in einer Seite - es müsste ok sein und ich will das app-Objekt genau ein mal
//-----------diesen Teil muesste ich aus pagecreate doch aus heraus nehmen können
//ein Test zeigt: das geht, aber dann muss veloStat.isInitialized in den
//Teil on(pagecreate) der ersten Seite, sonst kann ich nicht so einfach umleiten
//falls jemand eine Seite per direkter url aufruft, die frage ist - macht das was?
//die seiten sind doch auch sinnvoll aufrufbar, wenn ich die Start-Seite noch nicht
//geladen habe, also - mache dies
//in diesem Fall also doch in document.ready

//erweitere Math-Objekt

var veloStat = {
	isInitialized : false
};

function checkCache() 
{
	var appCache = window.applicationCache;

	switch (appCache.status) {
		case appCache.UNCACHED:
			// UNCACHED == 0
			return 'UNCACHED';
			break;
		case appCache.IDLE:
			// IDLE == 1
			return 'IDLE';
			break;
		case appCache.CHECKING:
			// CHECKING == 2
			return 'CHECKING';
			break;
		case appCache.DOWNLOADING:
			// DOWNLOADING == 3
			return 'DOWNLOADING';
			break;
		case appCache.UPDATEREADY:
			// UPDATEREADY == 4
			return 'UPDATEREADY';
			break;
		case appCache.OBSOLETE:
			// OBSOLETE == 5
			return 'OBSOLETE';
			break;
		default:
			return 'UKNOWN CACHE STATUS';
			break;
	}
}


$(document).on("mobileinit", function() {
	console.log("mobile init event fired ");    
    console.log(checkCache());	
	window.applicationCache.addEventListener('updateready', function(e) {
			if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
				// Browser hat einen neuen AppCache gebildet, klappt unter chrome auf Linux
				//spaeter mal raus
				if (confirm('A new version of this site is available. Load it?')) {
					window.location.reload();
				}
			} else {
				// Hier kann etwas gemacht werden, wenn der Cache nicht geupdated wurde
			}
		}, false);
    //anpassen der buttons
    
	 
	(function(app) {//anonymous function, called directly with veloStat
		//public vars, hmm, weiss nicht mehr warum ich ein paar korrekt mit
		//accessoren set/get baue und einige nicht :-)
		app.isInitialized = true;
		app.version = '0.1';
		app.map = null;
		app.markerAktuell = null;
		app.trackPath = null; //Pfad auf der Karte 
		app.storedTracks = []; //gespeicherte Daten aus local-Storage
		//nur local gebraucht
		var simulateFunctionTimer=null;
		//variablen, die im localStorage liegen müssen
		var distanz = 0;
		var energieWarnung = 0;
		var trackData = [];
		var energieSumme = 0;
		var storeTracksComplete = false;
		var simulation = false;
		var panTrack = false;
		var panPosition = false;
		var recordingDistance = 1; //in m - ab wann welcher Aenderung wird aufgezeichnet
        //setter getter
		app.getTrackData = function()
		{
			return trackData;
		};
		app.setEnergieWarnung = function(val) {
			energieWarnung = val;
			localStorage.setItem('energieWarnung', val);
			if (energieSumme > energieWarnung)
				$('h1').addClass('warning');
			else
				$('h1').removeClass('warning');
		};
		app.getEnergieWarnung = function() {
			return parseFloat(energieWarnung);
		};
		//------------
		app.setEnergieSumme = function(val) {
			energieSumme = val;
			localStorage.setItem('energieSumme', val);
			if (energieSumme > energieWarnung)
				$('h1').addClass('warning');
			else
				$('h1').removeClass('warning');
		};
		app.getEnergieSumme = function() {
			return parseFloat(energieSumme);
		};
		//------------
		app.setStoreTracksComplete = function(val) {
			storeTracksComplete = val;
			localStorage.setItem('storeTracksComplete', val);
		};
		app.getStoreTracksComplete = function() {
			return storeTracksComplete;
		};
		//--
		app.setSimulation = function(val) {
			simulation = val;
			localStorage.setItem('simulation', val);
			if (simulation && !simulateFunctionTimer) //also vorher aus
				simulateFunctionTimer = setInterval(function(){
					if (positionAktuell.coords)
						checkPosition(positionAktuell);					
					}, 2000);	
			else if (simulateFunctionTimer)			
				clearInterval(simulateFunctionTimer);
		};
		app.getSimulation = function() {
			return simulation;
		};
		//--
		app.setPanTrack = function(val) {
			panTrack = val;
			localStorage.setItem('panTrack', val);
		};
		app.getPanTrack = function() {
			return panTrack;
		};
		//--
		app.setPanPosition = function(val) {
			panPosition = val;
			localStorage.setItem('panPosition', val);
		};
		app.getPanPosition = function() {
			return panPosition;
		};
		app.setRecordingDistance = function(val) {
			recordingDistance = val;
			localStorage.setItem('recordingDistance', val);
		};
		app.getRecordingDistance = function() {
			return recordingDistance;
		};
		
		//



		//private vars
		var recording = false;
		var pause = false;
		var spannungStart = 0;
		var positionStart = {};
		var positionAktuell = {
			coords : null
		};
		var watchCounter = 0;
		var watchId;
		var geoErrors = ['unknown error', 'permission denied', 'pos unavailable', 'time out'];
		var getGeoError = function(error) {
			return geoErrors[error] + ' (' + error + ')';
		};
		//helper, private
		//distanz in km
		function calculateDistance(pos2,pos1)
		{ //von http://www.movable-type.co.uk/scripts/latlong.html
			var R = 6371; // km
			var lat1 = pos1.latitude* Math.PI/180.0;
			var lat2 = pos2.latitude* Math.PI/180.0;
			var dlat = lat2 - lat1;
			var dlon = (pos2.longitude - pos1.longitude) * Math.PI/180.0;

			var a = Math.sin(dlat/2) * Math.sin(dlat/2) +
        	Math.cos(lat1) * Math.cos(lat2) *
        	Math.sin(dlon/2) * Math.sin(dlon/2);
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			var d = R * c;
			return d;
		}
		function setStartDaten(positionStart) {
			if (positionStart === null) {
				positionStart = {
					coords : {}
				};
				positionStart.coords.latitude = positionStart.coords.longitude = '???';
			}
			$('#latStart').html(Math.round(positionStart.coords.latitude * 1000)/1000.0 + '&deg;');
			$('#lonStart').html(Math.round(positionStart.coords.longitude * 1000)/1000.0 + '&deg;');
		}

		function printAktuelleDaten(pos,distanz) {
			if (pos === null || pos.coords == null) {
				pos = {
					coords : {}
				};
				pos.coords.latitude = pos.coords.longitude = pos.coords.accuracy = pos.coords.speed = '???';
				$('#lonAktuell').html('???');
				$('#latAktuell').html('???');
				$('#genauigkeit').html('???');
				$('#geschwindigkeit').html('???');
				$('#entfernung').html('???'); 
			}
			else
			{
				$('#lonAktuell').html(Math.round(pos.coords.longitude * 1000) / 1000.0 + '&deg;');
				$('#latAktuell').html(Math.round(pos.coords.latitude * 1000)/ 1000.0 + '&deg;');
				var accur = pos.coords.accuracy ? Math.round(pos.coords.accuracy*1000)/1000.0 : '???';
				var speed = pos.coords.speed    ? Math.round(pos.coords.speed   *1000)/1000.0 : '???';	
				$('#genauigkeit').html(accur);
				$('#geschwindigkeit').html(speed);
				$('#entfernung').html(Math.round(distanz*1000) / 1000.0);
			} 
			$('#energieSumme').html(app.getEnergieSumme());
		}

		function stopIt() {
			pause = false;
			recording = false;
			watchCounter = 0;
			distanz=0;
			printAktuelleDaten(null,0);
			setStartDaten(null);
			trackData.length = 0;
			if (app.trackPath)
					app.trackPath.setMap(null);
			app.trackPath = null;

		}


		app.consoleLog = function(name) {
			console.log(name + " energieWarnung: " + app.getEnergieWarnung());
			console.log(name + " energieSumme: " + app.getEnergieSumme());
			console.log(name + " storeTracksComplete: " + app.getStoreTracksComplete());
			console.log(name + " simulation: " + app.getSimulation());
			console.log(name + " panTrack: " + app.getPanTrack());
			console.log(name + " panPosition: " + app.getPanPosition());
			console.log(name + " recordingDistance: " + app.getRecordingDistance());
		};

		function restoreSettingsFromStorage() {
			//-----
			energieWarnung = localStorage.getItem('energieWarnung');
			if (!energieWarnung)
				app.setEnergieWarnung(200);
			else
				energieWarnung = parseFloat(energieWarnung);
			//---------
			energieSumme = localStorage.getItem('energieSumme');
			if (!energieSumme)
				app.setEnergieSumme(0);
			else
				energieSumme = parseFloat(energieSumme);
			//---------
			
			recordingDistance = localStorage.getItem('recordingDistance') ?  
								parseFloat(localStorage.getItem('recordingDistance')) : 1;
			storeTracksComplete = localStorage.getItem('storeTracksComplete') 	== 'true' ? true : false;
			simulation 			= localStorage.getItem('simulation')		  	== 'true' ? true : false;
			panTrack 			= localStorage.getItem('panTrack') 				== 'true' ? true : false;
			panPosition 		= localStorage.getItem('panPosition') 			== 'false' ? false : true; //default anders

			if (simulation && !simulateFunctionTimer)
			{
				simulateFunctionTimer = setInterval(function(){
						if (positionAktuell.coords)
							checkPosition(positionAktuell);
					}, 2000);	
			}
			//---------

		}

		function handleStartRecording(pos) {			
			$('#bStart').addClass('ui-disabled');
			//console.log("handle start");
			if (pos.coords) //position bekannt
			{
				var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
				watchCounter++;
				positionStart = pos;
				trackData.push(pos);
				//es muss app nicht this sein, this ist window, aber im context dieser Funktion
				//existiert app noch und das war das veloStat-Objekt - trickreich?
				if (app.trackPath) { //wenn schon Pfad auf Karte -> anhaengen
					var googleTrack = app.trackPath.getPath();
					googleTrack.push(myLatlng);
					app.trackPath.setPath(googleTrack);
				}
				setStartDaten(positionStart);
				printAktuelleDaten(positionAktuell,0);
				recording = true;
				$('#controlDiv a').toggleClass("ui-disabled");
				$('#bStart').addClass('ui-disabled');
				$('#controlPageHeader').html('Control <span style="color:darkgreen">(recording ' + watchCounter + ')</span>');
			    
			}
			else
			{
				$('#controlPageHeader').html('Control, wait');				
				window.setTimeout(handleStartRecording,200,positionAktuell); //nach 200 ms neu versuchen
			}
		}

        //hole die Tracks und sortiere sie
        function getStoredTracks()
		{
			var counter=0;
			for ( i = 0; i < localStorage.length; ++i)//geht prinzipiell
			{
				var key = localStorage.key(i);
				if (!isNaN(Date.parse(key))) {
					var dataSet = localStorage.getObject(key);
					dataSet.onMap = false;
					dataSet.trackPath = null;
					app.storedTracks[counter++] = dataSet; //assoziativ ist nicht geeignet, da assoziatives Array = objekt
				}
			}
			app.storedTracks.sort(function(a,b)
			{
				return b.trackData[0].timestamp -a.trackData[0].timestamp;
			}
			);
		}
		//aufruf von der geolocation api s.u. in app.init
		function checkPosition(position) {
				var simulateMove = app.getSimulation();
				var pos = position;
				//real - referenz kopieren
				if (simulateMove) {
					pos = {
						coords : {
							latitude : position.coords.latitude,
							longitude : position.coords.longitude
						},
						timestamp: parseInt(Date.now())
					};
					//simulation: eigenes Objekt
				}
				//zum Test simulation einbauen, hmm - eigenes Objekt noetig, laesst sich nicht aendern, die eigenschaften in coords
				//scheinen auf readonly gesetzt - witzig, (Debugger zeigt es) (Ecma5 feature)
				
				if (positionAktuell.coords && simulateMove) {
					var lat = Math.random() * 0.005 - 0.0025;
					var lon = Math.random() * 0.005 - 0.0025;
					pos.coords.latitude = positionAktuell.coords.latitude + lat;
					pos.coords.longitude = positionAktuell.coords.longitude + lon;
				}
				//auch wenn nicht aufgezeichnet wird aktuelle Position anzeigen
				printAktuelleDaten(pos,distanz);
				//karo tocheck: wenn nicht online?
				var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
				if (app.markerAktuell)//wenn gesetzt, verschieben
				{
					app.markerAktuell.setPosition(myLatlng);
					var bounds = app.map.getBounds();
					if (app.getPanPosition() && bounds && ! bounds.contains(myLatlng))
						app.map.panTo(myLatlng);
				}
				if (recording && !pause) {

//					if (watchCounter == 0) {
//						handleStartRecording(pos); //nicht sicher, ob das hier sinnvoll ist
//					}					
					//else
					var lastPosition =  watchCounter > 0 ?
														  trackData[watchCounter - 1] : positionAkutell;
					var moveDistance = calculateDistance(pos.coords, lastPosition.coords);
					//moveDistance in km
					//console.log(moveDistance * 1000 + " und " + app.getRecordingDistance());
					if (moveDistance * 1000.0 > app.getRecordingDistance() &&//detect change						
						   ( !pos.coords.accuracy || //wenn keine accuracy aufzeichnen
						    ( pos.coords.accuracy < 10 * lastPosition.coords.accuracy &&
						       moveDistance * 1000.0 > pos.coords.accuracy/3.0 ))) 
						    //wenn accuracy dann aufzeichnen wenn keine plötzliche verzehnfachung
						    //des Wertes (das bedeutet meist neu Start der aufzeichnung, genauigkeit
						    //ist schlecht) und wenn die Bewegung groesser ist als die genauigkeit
					{    
						watchCounter++;
						distanz += moveDistance;
						trackData.push(pos);
						if (app.trackPath) {
							var googleTrack = app.trackPath.getPath();
							googleTrack.push(myLatlng);
							app.trackPath.setPath(googleTrack);
						}
						printAktuelleDaten(pos,distanz);
						$('#controlPageHeader').html('Control <span style="color:darkgreen">(recording ' + watchCounter + ')</span>');
					}
				}
				positionAktuell = jQuery.extend(true, {}, pos); //neues objekt als kopie

			}
		//init - am Anfang rufen
		app.init = function() {
			restoreSettingsFromStorage();
			getStoredTracks();
			app.consoleLog('init');
			var startPos;
			app.isInitialized = true;
			//add handler to geolocation 
			watchId = navigator.geolocation.watchPosition(
				function(position)
				{
					checkPosition(position);
				}
				, function(error) {//wird zumindest bei ablehnung nicht gerufen - seltsam
				console.log(error);
				errorText = getGeoError(error.code);
				$('#controlPageHeader').html('Control <span style="color:darkred">' + errorText + '</span>');
			}, {
				enableHighAccuracy : true
			});

			//------------------
			console.log("app.init");
			// init is the typical name that developers give for the
			// code that runs when an application first loads

		};

        //falls ein aktueller Track da - anzeigen
		app.showTrack = function() {
			//console.log("call to showTrack");
			if (!app.trackPath)
			{
					var googlePath = [];
					//check, ob Aufzeichnung gespeichert -> daten nachtragen
					var trackData = app.getTrackData();
					if (trackData.length > 0) {
						for ( i = 0; i < trackData.length; ++i) {
							var pos = trackData[i];
							var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
							googlePath.push(myLatlng);
						}
					}
					//wird in der polyline abgelegt
					app.trackPath = new google.maps.Polyline({
						path : googlePath,
						strokeColor : "#FF0033",
						strokeOpacity : 0.7,
						strokeWeight : 2,
						geodesic : true,
					});
					app.trackPath.setMap(app.map); //aktuelle ist eingetragen
		  }
		};
		//hat der User Tracks auf anzeigen gesetzt
		app.showUserTracks = function()
		{						 
			var trackEndPos = null;
			for (j =  app.storedTracks.length -1 ; j >= 0;  --j)
			{
				var dataSet = app.storedTracks[j];
				var googlePath = [];
				if (dataSet.onMap &&  !dataSet.trackPath)
				{ 
					for (i=0; i < dataSet.length; ++i)
					{
						var pos = dataSet.trackData[i].coords;
						var myLatlng = new google.maps.LatLng(pos.latitude, pos.longitude);
						googlePath.push(myLatlng);
					}
					dataSet.trackPath = new google.maps.Polyline(
						{
							path : googlePath,
							strokeColor : "#3300FF",
							strokeOpacity : 0.7,
							strokeWeight : 2,
							geodesic : true,							
						}
					);
					dataSet.trackPath.setMap(app.map);
				}
				if (dataSet.onMap)
				{
					googlePath = dataSet.trackPath.getPath(); //googlepath holen
					trackEndPos = googlePath.getAt(googlePath.length - 1);
				}
			}
			//wenn panTrack: falls ein User-Track angezeigt wird und letzte Position außerhalb
			//dann pan zu dieser Position. Reihenfolge: zum neuesten markierten track wird ein pan durchgeführt	
			var bounds = app.map.getBounds();
			if (app.getPanTrack() && bounds && trackEndPos && ! bounds.contains(trackEndPos))
				app.map.panTo(trackEndPos);			

		};
		//oeffentliche Methoden fuer die Buttons
		app.startButtonClick = function() {
			if (pause == true)
				pause = false;
			else if (recording == false)//neustart, popup und startEvent
			{
				$('#labelInSpannung').html("Spannung (Start)");
				$('#fsStoreComplete').hide();
				$('#fsEnergie').hide();
				$("#popUpSpannung").popup("open").off().on("popupafterclose", veloStat.startEvent);
			}
		};
		//-------------start event -----------------
		app.startEvent = function(event, ui) {
			//schalte ui-disabled um -> start now disabled
			spannungStart = parseFloat($('#inSpannung').val());
			if (isNaN(spannungStart))
				spannungStart = 0;
			$('#spannungStart').text(spannungStart + " V");
			handleStartRecording(positionAktuell);
		};
		app.stopSaveEvent = function(event, ui) {
			if (!localStorage)
				$('#controlPageHeader').html('Control <span style="color:darkred">(Kein lokaler Speicher)</span>');
			else if (trackData.length == 0) {
				$('#controlPageHeader').html('Control <span style="color:darkred">(Keine Daten)</span>');
			} else {//key value -> nehme ein Objekt, key timestamp des ersten Datensatzes
				app.setStoreTracksComplete($('#cbStoreComplete').prop('checked'));
				var spannungStop = parseFloat($('#inSpannung').val());
				var energieVerbrauch = parseFloat($('#inEnergie').val());
				if (isNaN(energieVerbrauch))
					energieVerbrauch = 0;
				if (isNaN(spannungStop))
					spannungStop = 0;
				if (!app.getStoreTracksComplete() && trackData.length > 2) {
					trackData[1] = trackData[trackData.length - 1];
					trackData.length = 2;
				}
				app.setEnergieSumme(app.getEnergieSumme()+energieVerbrauch);
				
				var data = new StoreObject(spannungStart, spannungStop,
					                       energieVerbrauch, distanz,  app.getStoreTracksComplete(), trackData);
				var td = new Date(trackData[0].timestamp);
				var key = td.toString();
				//karo hier try catch einbauen, mit der Option nur Anfangs und Endpunkt des Tracks zu speichern
				localStorage.setObject(key, data);
				//fuer data sollte toJSON gerufen werden, ja
				var storedObject = localStorage.getObject(key);
				storedObject.onMap = false;
				app.storedTracks.unshift(storedObject); //lokal am Anfang einbauen 
				$('#controlPageHeader').html('Control <span style="color:darkgreen">(saved)</span>');

			}
			stopIt();
			$('#controlDiv a').toggleClass("ui-disabled");

		};
		app.pauseButtonClick = function() {
			if (!pause) {
				$(this).html("Weiter");
				$('#controlPageHeader').html('Control <span style="color:darkblue">(paused ' + watchCounter + ')</span>');
			} else {
				$(this).html("Pause");
				$('#controlPageHeader').html('Control <span style="color:darkgreen">(recording ' + watchCounter + ')</span>');
			}
			pause = !pause;
		};
		app.stopButtonClick = function() {
			//off().on()damit funktion nicht mehrfach gebunden
			$('#popUpWirklichStopYes').off().on('click', function(event) {
				stopIt();
				$('#controlPageHeader').html('Control <span style="color:darkred">(not saved)</span>');
				$('#controlDiv a').toggleClass("ui-disabled");
			});
			$('#popUpWirklichStop').popup('open');
		};
		app.stopSaveButtonClick = function() {
			$('#labelInSpannung').html("Spannung (Ende)");
			$('#fsStoreComplete').show();
			$('#fsEnergie').show();
			$("#popUpSpannung").popup("open").off().on("popupafterclose", veloStat.stopSaveEvent);
			$('#cbStoreComplete').prop('checked', app.getStoreTracksComplete()).checkboxradio('refresh');
		};
		app.datenLoeschenButtonClick = function() {
			$("#popUpEtcWirklichStopYes").off().on('click', function() {
				//einstellung(en) behalten
				localStorage.clear();
				app.storedTracks.length = 0;
				app.setEnergieWarnung(app.getEnergieWarnung());
				//set Speichert direkt
				app.setEnergieSumme(app.getEnergieSumme());
				app.setStoreTracksComplete(app.getStoreTracksComplete());
				app.setSimulation(app.getSimulation());
			});
			$("#popUpEtc").popup("open");
		};

		app.getAktuelleCoord = function() {
			return positionAktuell.coords;
		};
		
		//loesche die Datensaetze deren index in xArray
		app.removeData = function (xArray)
		{
			for (var i = 0; i < xArray.length; ++i)
			{
				var index = xArray[i];//nun index -i, denn jedes splice reduziert length
				var td = new Date(veloStat.storedTracks[index-i].trackData[0].timestamp);
				var key = td.toString();
				app.storedTracks.splice(index-i,1); 
				localStorage.removeItem(key);
			}		
		};
		//reduziere die anzahl der Tracks in deren index in xArray
		app.reduceData = function(xArray)
		{
			for (var i = 0; i < xArray.length; ++i)
			{
				var index = xArray[i];
				var td = new Date(veloStat.storedTracks[index].trackData[0].timestamp);
				var key = td.toString();
				var storedObject = localStorage.getObject(key,StoreObject); //"richtiges Objekt" erzeugen
				if (storedObject.reduceData())
				{
					veloStat.storedTracks[index] = storedObject; //setzen falls noetig  
					localStorage.setObject(key,storedObject); 
				}	
				 					
				
			}
		};
		//und zum Schluss call auf app.init(), app.init nochmal durchdenken ...
		app.init();

	})(veloStat);
});
