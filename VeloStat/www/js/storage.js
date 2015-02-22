//folgendes koennte gehen, baue selber eine Klasse, die ein zu speicherndes
//objekt repraesentiert - originale stringify methode hatte probleme mit
//verschachtelten Strukturen (haette man auch in stopSave unterbringen koennen
//eigentlich ist das aber Quatsch, die Trackdaten brauche ich nicht fuer diese
//Anwendung, lediglich die zurueck gelegte Strecke sollte ich speichern
//aber - was gelernt :-) und wenn ich die trackdaten schon habe ...
var StoreObject = function(spStart, spStop, energie, distanz,komplett, data) {
	this.spannungStart = spStart ? spStart : 0;
	this.spannungStop = spStop ? spStop : 0;
	this.trackData = data;
	this.trackKomplett = komplett ;
  this.energie = energie;
  this.distanz = distanz;
	this.length = data ? data.length : 0;
	this.reduceData = function ()
	{
		var result = false ; //aenderung?
		if (this.length > 2)
		{
			this.trackKomplett = false;
			this.trackData[1] = this.trackData[this.length - 1];
			this.trackData.length = this.length = 2;
			result = true;
		}
		//console.log(this);
		//console.log("result: "+ result);
		return result;		
	};
	this.toJSON = function() {
		var result = {};
		result.spannungStart = this.spannungStart;
		result.spannungStop = this.spannungStop;
		result.energie = this.energie;
		result.distanz = this.distanz;
		result.length = this.trackData.length;
		result.trackKomplett = this.trackKomplett;
		result.trackData = [];
		for (var i = 0; i < result.length; ++i) {
			result.trackData[i] = {
				timestamp : this.trackData[i].timestamp};
			result.trackData[i].coords = {	
				latitude : this.trackData[i].coords.latitude,
				longitude : this.trackData[i].coords.longitude,
				altitude : this.trackData[i].coords.altitude,
				accuracy : this.trackData[i].coords.accuracy,
				heading : this.trackData[i].coords.heading,
				speed : this.trackData[i].coords.speed
			};
		} 
		//zeit in ms -> / 3 600 000 liefert Stunden
 		var zeit = new Date(result.trackData[result.length - 1].timestamp) - new Date(result.trackData[0].timestamp );
		var geschwindigkeit = NaN;
		if (zeit != 0)
		{ 
			 geschwindigkeit = distanz * (3600000.0/zeit)  ; //km/h
		}
		result.geschwindigkeit = geschwindigkeit;
		
		return result;
	};
	this.parseJSON = function (jsonObject)
	{
		if (typeof jsonObject == "string")
		{	
			jsonObject = JSON.parse(jsonObject);
		}
		//not deep for all types, but "egal"
		for (var attr in jsonObject)
			if (this.hasOwnProperty(attr)) this[attr] = jsonObject[attr];
	};
};

Storage.prototype.setObject = function(key, value) {
	var jsonStringify = JSON.stringify(value);
	this.setItem(key, jsonStringify);
};

//return free space in Byte bzw. kb
Storage.prototype.getUsed = function() {
	var used = unescape(encodeURIComponent(JSON.stringify(localStorage))).length;
	
	if (used > 1024) 
		used = (used/1024).toFixed(2) + " kB";
	else 
		used = used+" B";
  	return used;
};

//folgendes kann erstmal nur eine Datensammlung sein
/*
Storage.prototype.getObject = function(key) {
        var value = this.getItem(key);
        return value && JSON.parse(value); //trickreich
};
*/
//das ist doch doof, mache also ein Objekt vom "Typ" className daraus
Storage.prototype.getObject = function(key,classPointer) {
	var value = this.getItem(key);	
	if (!classPointer)
		return value && JSON.parse(value); //trickreich
	else
	{
		var value = this.getObject(key);
		var result = null;
		if (value)
		{
			result = new classPointer();
			result.parseJSON(value); //das ist jetzt ein richtiges Objekt
		}	
		return result;
	} 
};
