
#VeloStat 
==========================================

Eine Velomobilisten-App :-) für Android

Zunächst wollte ich lediglich den Energieverbrauch des Akkus 
summieren, um zu sehen, wie lange er hält, es sollte nur ein mini-Projekt 
werden, daher auch nicht besonders dokumentiert.

Erster Gedanke: Geht doch sicher mit JavaScript, mal eben was zusammen gebastelt.

Inzwischen gibt es drei Versionen, im Prinzip explorative Prototypen - also ohne 
große Planung nur ein wenig herum gespielt. Prinzipiell sind alle drei gleich.

* VSHtml - eine HTML/JS Variante, eingesetzt nur jquery-mobile und geolocation
  <a href="http://zb42.de/cc/VSHtml/">Der Link zur HTML-Seite</a>.  

* VSAppCache - mal mit dem AppCache gearbeitet, ziemliches hin und her tricksn mit
  der manifest datei. Unterschiede marginal.
  Die Datei sollte dafür sorgen, dass der Browser auf die Verwendung des 
  AppCache aufmerksam macht.   <a href="http://zb42.de/cc/VSAppCache/">Hier diese Variante</a>. 

* VeloStatCordova - aus der HTML-Variante entstanden, umgesetzt (s.u.) in eine Android
  App. Vorteil: das Teil läuft auch im Hintergrund weiter, wenn man die Daten also
  als Track aufnehmen möchte ist es schon von Vorteil. Das Entstehen der apk ist 
  unten dokumentiert. <a href="http://zb42.de/cc/VeloStatCordova/VeloStatCordova.apk">Hier ein Download-Link.</a> 
	(kein PlayStore, bin nicht als 
  Entwickler registriert).<br>
  Diese Variante findet sich <a href="https://github.com/Roemke/VeloStatCordova">auch auf Github.</a>


Ein wenig experimentiert wurde auch  mit dem  Speichern der Daten auf einem Webserver
(dafuer der ajaxKnecht.php), werde dies jedoch  nicht brauchen, da ich meinen 
Weg zur Arbeit dann doch nicht aufzeichnen werde - vielleicht später mal.

Notizen ungeordnet:  

* Geolocation api mal ausprobieren, aufnehmen der Strecke
abspeichern und Energieverbrauch dazu nehmen
* Unter anderm gelernt: Mit dem Chromebrowser lässt sich die Anwendung auf dem Smartphone debuggen.
Usb-Debugging auf smartphone ein, auf Linux Chrome weitere Tools Geräte untersuchen dann auf inspect
* groesster nachteil bisher: eine Html5 App kann nicht im Hintergrund laufen, man findet auch keinen Event
laesst sich mit monitorEvents('document') auf der Konsole von Googlechrome beobachten
mit unmonitorEvents wieder abschalten  - mit cordova geht es (phone-gap)

Hier jetzt eine cordova Variante, mal sehen, ob das funktioniert

##Vorgehen (nochmal ergänzt/durchgespielt 2015-02-22):

grobes vorgehen nach cordova cli variante  
http://cordova.apache.org/docs/en/4.0.0/guide_cli_index.md.html 
(bisschen bereinigt,
 durchgefuehrt auf notebook, cordova auf server noch nicht
 installiert)
 - SDK fuer Android installiert (Schritte nicht dokumentiert, 
   duerfte man aber im Netz finden)
 - VSHtml kopiert nach VeloStatCordova - arbeite hier
 - node js installiert, git client installiert
 - sudo npm install -g cordova
 - cordova create -d VeloStat de.zb42.velostat VeloStat
   im Ordner VeloStatCordova - verzeichnis VeloStat wird angelegt:
  
```
   VeloStat/
     VeloStat/hooks
     VeloStat/hooks/README.md
     VeloStat/config.xml
     VeloStat/platforms
     VeloStat/plugins
     VeloStat/www
     VeloStat/www/img
     VeloStat/www/img/logo.png
     VeloStat/www/css
     VeloStat/www/css/index.css
     VeloStat/www/js
     VeloStat/www/js/index.js
     VeloStat/www/index.html
```
 - alle Dateien (html/js etc)  kopiert, angepasst an Struktur:
```
		roemke@kspace42:~/public_html/cc/VeloStatCordova$ cp -r js/* VeloStat/www/js/
    roemke@kspace42:~/public_html/cc/VeloStatCordova$ cp  css/VeloStat.css VeloStat/www/css/
		roemke@kspace42:~/public_html/cc/VeloStatCordova$ cp VeloStat.html VeloStat/www/index.html
		roemke@kspace42:~/public_html/cc/VeloStatCordova$ cp -r images/* VeloStat/www/img/
```
spare mir ajaxKnecht.php - der muss auf Webserver liegen

 - cd VeloStat
   config.xml angepasst, selbst erklaerend, dazu: 
		    <icon src="www/img/velo128.png" />  und       
        Autor Karsten Römke nicht Karsten R&ouml;mke 
 - cordova platform add android
 - cordova plugin add org.apache.cordova.geolocation
 - cordova build
 - cordova run android oder cordova emulate android
   lief eigentlich danach schon

Build liefert: 

    Built the following apk(s):
	  /home/roemke/public_html/cc/VeloStatCordova/VeloStat/platforms/android/ant-build/CordovaApp-debug.apk

		found: The -debug part means that it was signed with the default debug key. 


noch ein paar Anmerkungen:  
* geolocation html5 schien nicht zu laufen - plugin von cordova dazu 
  und es geht (s. oben)
* schöner nebeneffekt - man kann die App in den Hintergrund setzen und die Aufzeichnung
  läuft weiter, selbst wenn man den Bildschirm abschaltet funktioniert es.
* einige aenderungen layout, die aber auch bei der webapp noetig gewesen waeren
* auf den PlayStore werde ich das Teil wohl nicht schieben, da ich kein Entwicklerkonto habe
  Installieren kann man die APK, wenn man apps aus fremden Quellen zulässt. 
  Dann Download, installieren und man bekommt gezeigt, dass die APP Netzwerkzugriff und 
  Zugriff zum GPS möchte.
   