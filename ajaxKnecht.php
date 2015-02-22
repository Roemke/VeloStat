<?php
  $path="storedData/";
  $action = $_POST['action'];
  $retVal = '';
  if ($action == 'save')
  {
	  $len = $_POST['len'];
	  if ($len != 0) 
	  	$data = $_POST['data'];
	  $retVal = 'stored: ';
	  for ($i = 0; $i < $len; ++$i)
	  {
	  	 $dataSet = $data[$i];
		 $ts = intval(intval($dataSet['trackData'][0]['timestamp'])/1000);
		 $datum = new DateTime("@$ts",new DateTimeZone('UTC'));//javascript liefert utc
		 $datum->setTimeZone(new DateTimeZone('Europe/Berlin'));//haette gern Berlin
	     $retVal .=  $datum->format('Y-m-d_H-i-s') .' ';	  
	     $fp = fopen($path.$datum->format('Y-m-d_H-i-s'),'w');
	  	 fputs($fp,var_export($dataSet,true));
		 fclose($fp);
	  }
	  
  }
  else if ($action == 'getList')
  {
  	//verzeichnis auslesen
  	$files = scandir($path);
	array_shift($files);
	array_shift($files); //punkte weg, einfache Variante reicht mir
	$retVal = json_encode($files);
	
  }
  else {
      $retVal = "unknown action";
  }
  echo $retVal;
?>