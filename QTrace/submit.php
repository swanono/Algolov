<?php
//Répertoire des fichiers de traces.
//dirname(__DIR__) donne le dossier où est ce fichier.
//En cas de modification bien terminer le chemin par \\.
//Ici les fichiers de traces vont dans le dossier results.
//
//Bien vérifier les accès en écriture dans les dossiers!
$directory=dirname(__DIR__).'/results/';
/////////////////////////////////////////
$file_name=$directory.strval(uniqid()).'.json';
while(file_exists($file_name))
	$file_name=$directory.strval(uniqid()).'.json';
$file_handle = fopen($file_name, 'w');
fwrite($file_handle, $_POST["json"]);
fclose($file_handle);
?>
