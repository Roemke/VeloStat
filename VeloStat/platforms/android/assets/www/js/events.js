/**
 * @author Karsten Römke
 * events und ein paar Hilfsfunktionen
 */
//Hilfs-Funktionen
//s. http://www.gajotres.net/page-events-order-in-jquery-mobile-version-1-4-update/
//and http://stackoverflow.com/questions/14468659/jquery-mobile-document-ready-vs-page-events
//pageinit is deprecated,  pagecreate statt dessen
//mit dem Parameter controlPage wird angegeben, dass nur bei der Controlpage
//das ganze gerufen wird -> vermeide den erneuten Aufruf beim Wechsel auf die
//naechsten Seiten (wird in den api-docs nur beim beispiel von pageinit klar)
//passe buttons an - quelle ist http://jsfiddle.net/Palestinian/UYa4Y/
//allerdings angepasst auf jquery mobile 1.4
//interessant, laeft fuer firefox mobile nicht, fuer firefox geht es - alles murcks :-)
function alignControlButtons()
{
	// Number of buttons
	var buttons = $('#controlDiv').find('a').length;
	// Parent div width
	var btn_width = $('#tiled').width() / buttons;

	// Remove left/right button padding
	$('#controlDiv a').css({
		'padding-left' : 1,
		'padding-right' : 1
	});

	// Set button new width
	$('#controlDiv a').width(btn_width - 4);

	// Adjust font-size for each button based on text
    var ow  = $('#controlDiv a').width(); 
	$('#controlDiv a span').each(function() {
		var sw = $(this).width();
		while (sw > ow) {
			var font = parseFloat($(this).css('font-size')) - 1 + "px";
			$('#controlDiv a span').css('font-size', font);
			console.log("found ow " + ow + " and sw "+ sw);
			sw = $(this).width();
						
		}
	});
}
function refreshDataPage()
{
	var dataString = '<li  data-role="list-divider">Datenfile'
	     + '<div class="krListDivsFloat ui-checkbox" style="margin-right:22px;"><label class="krListLabel blue" id="DataMap" >map</label></div>'
	     + '<div class="krListDivsFloat ui-checkbox"><label class="krListLabel blue" id="DataX" >X</label></div>'
	     + '<div class="krListDivsFloat ui-checkbox"><label class="krListLabel">TPts</label></div></li>';
	var li=$('#divDataList ul li input'); //falls schonmal aufgerufen sind welche da sonst length 0
	var counter = 0;
    //gespeicherte Tracks einbauen
    for (i=0; i < veloStat.storedTracks.length; ++i)
    {
    	dataSet = veloStat.storedTracks[i];
    	checkedMap = dataSet.onMap  ? "checked" : "";
    	checked='';
    	key = new Date(dataSet.trackData[0].timestamp).toLocaleString();
		dataString += ('<li><a  href="#dataPageEinzeln">' + key  
		  +'<div class="krListDivsFloat"><input id="cmcheck-'+i+'" class="cmcheck" style="width:0px" ' + checkedMap + ' type="checkbox" >'
		  +  '<label for="cmcheck-' + i + '" class="krListLabel"></div>'
		  + '<div class="krListDivsFloat"><input id="cxcheck-'+i+'" class="cxcheck" style="width:0px"  ' + checked + ' type="checkbox" >'
		  + '<label for="cxcheck-' + i + '" class="krListLabel"></div>'
		  + ' <div class="krListDivsFloat ui-checkbox" ><label class="krListLabel"> ' +dataSet.length + '</label></div>'		  
		  +'</a></li>'
		  );
    }//nocn nicht ganz gluecklich mit den checkboxen in der listview
    //lassen wir es erstmal so, mit chrome geht es
	$('#divDataList ul').html(dataString);
	$('#divDataList ul').listview('refresh');
	$('.cxcheck').checkboxradio({wrapperClass: 'krCBWrapper'});
	$('.cxcheck').checkboxradio('refresh');
	$('.cmcheck').checkboxradio({wrapperClass: 'krCBWrapper'});
	$('.cmcheck').checkboxradio('refresh');
	
	$('#usedStorage').html(localStorage.getUsed());
}

function createMap() {
	var coords = veloStat.getAktuelleCoord();
	var myLatlng = new google.maps.LatLng(coords.latitude, coords.longitude);
	/*
	 Build list of map types.
	 You can also use var mapTypeIds = ["roadmap", "satellite", "hybrid", "terrain", "OSM"]
	 but static lists sucks when google updates the default list of map types.
	 */
	var mapTypeIds = [];
	for (var type in google.maps.MapTypeId) {
		mapTypeIds.push(google.maps.MapTypeId[type]);
	}
	mapTypeIds.push("OSM");
	var minZoomLevel = 20;
	veloStat.map = new google.maps.Map(document.getElementById('mapArea'), {
		zoom : minZoomLevel,
		center : myLatlng,
		mapTypeId : "terrain",
		mapTypeControlOptions : {
			mapTypeIds : mapTypeIds
		},
	});
	veloStat.map.mapTypes.set("OSM", new google.maps.ImageMapType({
		getTileUrl : function(coord, zoom) {
			return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
		},
		tileSize : new google.maps.Size(256, 256),
		name : "OpenStreetMap",
		maxZoom : 18
	}));
	veloStat.markerAktuell = new google.maps.Marker({
		position : myLatlng,
		map : veloStat.map,
		icon : {
			path : google.maps.SymbolPath.CIRCLE,
			scale : 5
		},
		title : 'aktuell'
	});
}


function waitPosition() {
	$('#mapHeader').html('Map');
	var coords = veloStat.getAktuelleCoord();
	if (!coords) 
	{
		$('#mapHeader').html('Map <span style="color:darkred;"> suche Position  </span>');
		window.setTimeout(waitPosition, 500);		
	}
	else
	{ //coordinaten da 
		if (!veloStat.map)
			createMap();
    veloStat.showTrack();
		veloStat.showUserTracks();	
	}
}

//Events anhaengen

$(document).on('pagecreate', '#controlPage', function() {
	/* folgendes zeigt: in dieser App, ich denke weil alles in einder Datei
	* sind die folgende Elemente hier schon vorhanden
	* auf Unterelemente kann man allerdings noch nicht zugreifen, um z.B. einen
	* Button an ein Event zu binden (evtl, wenn man die on-Funktionalität zum Umsetzen
	*     eines "alten" live-Events nutzt)
	*/
	//Events anhaengen, einmal, hier wird gesammelt und dann verteilt
	$('#bStart').on('click', veloStat.startButtonClick);
	//pausebutton
	$('#bPause').on('click', veloStat.pauseButtonClick);
	//stop and discard
	$('#bStop').on('click', veloStat.stopButtonClick);
	//stop and save
	$('#bStopSave').on('click', veloStat.stopSaveButtonClick);
	//weitere Events bei der Seite, auf der die Buttons angezeigt werden (pagecreate)

});
$(document).on('pageshow','#controlPage',alignControlButtons);



$(document).on('pageshow', '#mapPage', waitPosition);
//no page create for mappage noetig

//events etcPage
$(document).on('pagecreate', '#etcPage', function() {
	$('#energieWarnung').on('change', function() {
		if (veloStat.isInitialized)
			veloStat.setEnergieWarnung($('#energieWarnung').val());
	});
	$('#recordingDistance').on('change', function() {
		if (veloStat.isInitialized)
			veloStat.setRecordingDistance($('#recordingDistance').val());
	});
	//Daten loeschen
	$('#bDatenLoeschen').on('click', veloStat.datenLoeschenButtonClick);
	//Button Daten loeschen
	$('#bEnergieSummeLoeschen').on('click', function() {
		console.log("Energie 0 Scotty");
		veloStat.setEnergieSumme(0);
	});
	$('#cbStoreTracksComplete').on('change', function() {
		var sttComplete = $(this).prop('checked');
		veloStat.setStoreTracksComplete(sttComplete);
	});
	$('#cbSimulation').on('change',function(){
		veloStat.setSimulation($(this).prop('checked'));
	});
	$('#cbPanPosition').on('change',function(){
		veloStat.setPanPosition($(this).prop('checked'));
	});
	$('#cbPanTrack').on('change',function(){
		veloStat.setPanTrack($(this).prop('checked'));
	});
	

});
$(document).on('pageshow', '#etcPage', function() {
	veloStat.consoleLog('pageshow etcPage');
	$('#energieWarnung').val(veloStat.getEnergieWarnung());
	$('#energieWarnung').slider('refresh');
	$('#recordingDistance').val(veloStat.getRecordingDistance());
	$('#recordingDistance').slider('refresh');
	$('#cbStoreTracksComplete').prop('checked',veloStat.getStoreTracksComplete()).checkboxradio('refresh');
	$('#cbSimulation').prop('checked',veloStat.getSimulation()).checkboxradio('refresh');
	$('#cbPanPosition').prop('checked',veloStat.getPanPosition()).checkboxradio('refresh');
	$('#cbPanTrack').prop('checked',veloStat.getPanTrack()).checkboxradio('refresh');
	
});
$(document).on('pagecreate', '#dataPage', function() {
	//vor dem Wechsel zur Datenseite wird die Funktion gerufen
	$('#divDataList').on('click', 'a', function() {
		var index = $('#divDataList a').index($(this));
		var dataSet = veloStat.storedTracks[index];
		var dtStart = new Date(dataSet.trackData[0].timestamp);
		var dtEnd = new Date(dataSet.trackData[dataSet.length-1].timestamp);
		$('#ddDTStart').html(dtStart);
		$('#ddDTEnd').html(dtEnd);
		dataSet.trackKomplett ? $('#ddTrackKomplett').html(dataSet.trackKomplett) : $('#ddTrackKomplett').html('false');
		$('#ddPositionen').html(dataSet.length);
		$('#ddSpStart').html(dataSet.spannungStart);
		$('#ddSpEnd').html(dataSet.spannungStop);
		$('#ddEnergie').html(dataSet.energie);
		$('#ddDistanz').html(Math.round(dataSet.distanz*1000)/1000.0);
		$('#ddGeschwindigkeit').html(Math.round(dataSet.geschwindigkeit*1000)/1000.0);
	  $('#tabTrackData tr').remove();
	  $('#tabTrackData').append('<tr><th>Zeit</th> <th>Genauigkeit</th>' +
	                            '<th>latitude</th><th>longitude</th></tr>');
       		
    	for (i = 0 ; i < dataSet.length; ++i)
    	{
      		var d = new Date(dataSet.trackData[i].timestamp);
      		$('#tabTrackData').append('<tr><td>'+d.toLocaleTimeString() + '</td><td align="center">' 
                   +dataSet.trackData[i].coords.accuracy + '</td><td>'
                   +Math.round(dataSet.trackData[i].coords.latitude  * 1000)/1000.0 + '&deg; </td><td>'
                   +Math.round(dataSet.trackData[i].coords.longitude * 1000)/1000.0 + '&deg; </td></tr>');
    	}
	});
	
	//hier passiert ein bisschen viel, sollte evtl. nach veloStatApp.js
    $('#divModifyButtons button').on('click', 
  		function()
   		{
   			var val = $(this).attr('value');
			var xArray = [];
			$('#divDataList ul input.cxcheck:checked').each(
				function(){
					var li=$(this).parents('li');
					var index = $('#ulDataList li').index(li[0]) - 1;
					xArray.push(index);	
				}
			);

			if (val == 't') //transfer zum server
			{
			  var storedData = [];
			  for (var i = 0; i<xArray.length; ++i)
			  	storedData[i] = veloStat.storedTracks[xArray[i]];	
			  $.post('ajaxKnecht.php',
			  {
			      action: 'save',
			      len: xArray.length,
			      data: storedData,
			  }, 
			  function(data)
			  {
			  	console.log(data);
			  });
			}
			else if (val == 'r')
			{
				$.post('ajaxKnecht.php',
			  	{
			      action: 'getList',
			  	}, 
			  	function(data)
			  	{
			  		var data = JSON.parse(data);
			  		$('#divServerData').html('');
			  		//wollte das fieldset fuellen, das geht aber nicht, beim zweiten
			  		//Aufruf verschwindet die controlgroup, nicht zu verstehen
			  		//evtl. bug 
			  		var entry =  "<fieldset id='fsServerData' data-role='controlgroup' data-iconpos='right'>";
					for (var i=0; i < data.length; ++i)
					{
						entry += '<input type="checkbox" id="cbServer' + i + '">';
				    entry += ('<label for="cbServer'+i+'">'+data[i]+'</label>');
					}	
					 entry += '</fieldset>';
					 $('#divServerData').html(entry);	
			  		$( "body" ).pagecontainer( "change", "#serverData", { transition: "slide" });
			  		//refresh wird noetig sein?
			  		
			  	});
			}
			else
			{
				$('#popUpSicherYes').off().on('click',
					function()
					{
						//console.log(veloStat.storedTracks);
						if (val == 'x')
							veloStat.removeData(xArray); //loeschen
						else if (val == '-')
							veloStat.reduceData(xArray); //track-points auf zwei reduzieren
						refreshDataPage();	 
					});	
				$('#popUpSicher').popup('open');			   	
			}		
 		});
 	$('#divDataList').on('click','#DataX',function(e)
 	{
 		$('input.cxcheck').each(function()
 		{
	 		var status = $(this).prop('checked'); 	 		
			$(this).prop('checked',!status);
		    $(this).checkboxradio('refresh');
		    $(this).change();
 		}); 		
 	});	
 	$('#divDataList').on('click','#DataMap',function(e)
 	{
 		$('input.cmcheck').each(function()
 		{
	 		var status = $(this).prop('checked');
			$(this).prop('checked',!status);
		    $(this).checkboxradio('refresh');
		    $(this).change();
 		}); 		
 	});	
 	
 	//hmm, wird nicht gerufen bei change ueber obige routine, doch mit ausloesen click geht es :-)
	$('#divDataList').on('change','input.cmcheck',function(e)
	{
		var li=$(this).parents('li');
		var index = $('#ulDataList li').index(li[0]) - 1;
		var dataSet = veloStat.storedTracks[index];
		dataSet.onMap = this.checked;
		if(!dataSet.onMap && dataSet.trackPath)
		{
			dataSet.trackPath.setMap(null);
			dataSet.trackPath = null;	
		}
	});
});
$(document).on('pageshow','#serverData',function() {
  $('#divServerData').trigger('create');
	//$('#fsServerData input[type="checkbox"]').checkboxradio('refresh');	
});
//button uebernehmen in Page serverData
$(document).on('pagecreate','#serverData',function(){ 
  $('#bGetServerData').click(function()
  {
    $('#divServerData input:checked').each(
      function()
      {
        var fileName=$("#divServerData label[for=" + $(this).attr("id") + "]").text();        
        $.post('ajaxKnecht.php',
			  {
			      action: 'getDataSet',
			      name: fileName,
			  }, 
			  function(data)
			  {
			  	console.log(data);
			  });

      });
  });
  });
  
$(document).on('pageshow', '#dataPage', function() {
	//$('#divDataList ul li').remove();
	refreshDataPage();	
}); 
