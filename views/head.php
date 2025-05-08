<?
// open-records-generator
require_once(__DIR__ . '/../../open-records-generator/config/config.php');
require_once(__DIR__ . '/../../open-records-generator/config/url.php');
require_once(__DIR__ . '/../config/config.php');
// site
// require_once('static/php/config.php');
// require_once('static/php/functions.php');
$site_title = 'Online Resource Generator';
$db = db_connect("guest");
$oo = new Objects();
$mm = new Media();
$ww = new Wires();
$uu = new URL();

$css = array(
	'static/css/main.css'
);

/* 
	fetching record by uri if the page is not the online resource generator root. 
	
	if
	1. there's no such record
	2. the body of the record is empty, 
	   meaning it is a directory or
	   created by accident
	then $record_id is an empty string.

	if $record_id is an empty string and the page is not the online resource generator root, 
	redirect to online resource generator root
*/
$record_id = '';
$root_path_count = count(explode('/', $root_path));
if(count($uri) > $root_path_count) {
	$temp_url = array_slice($uri, $root_path_count);
	$temp = $oo->urls_to_ids(array_merge($root_database, $temp_url));
	if(count($temp) == count($root_database) + count($temp_url)) {
		$record_id = end($temp);
		$temp = $oo->get($record_id);
		// if(!$temp['body']) $record_id = '';
	}   
}
if(!$record_id && (count($uri) > count(explode('/', $root_path)))) {
	header("Location: " . $root_path);
}

?><!DOCTYPE html>
<html lang="en">
<head>
	<title><?= $site_title; ?></title>        
    <!-- <link rel="icon" type="image/x-icon" href="/media/ico/favicon.ico"> -->
	<meta charset="utf-8">
	<meta name="title" content="<?= $site_title; ?>"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
	<?php 
	foreach($css as $link){
		echo '<link rel="stylesheet" href="'.$root_path . '/' . $link.'">';
	} 
	// foreach($fonts as $font){
	// 	echo $font;
	// } 
	?>
</head>
<body>
