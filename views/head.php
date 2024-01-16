<?
// open-records-generator
require_once(__DIR__ . '/../../open-records-generator/config/config.php');
require_once(__DIR__ . '/../../open-records-generator/config/url.php');

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
$fonts_root = __DIR__ . '/../static/fonts';
$fonts = scandir($fonts_root);
foreach($fonts as $font) {
	if(substr($font, 0, 1) === '.' || substr($font, 0, 1) === '_') continue;
	$files = scandir($fonts_root . '/' . $font);
	foreach($files as $f) {
		if(substr($f, -4) === '.css') $css[] = 'static/fonts/' . $font . '/' . $f;
	}
}
?><!DOCTYPE html>
<html lang="en">
<head>
	<title><?= $site_title; ?></title>        
    <!-- <link rel="icon" type="image/x-icon" href="/media/ico/favicon.ico"> -->
	<meta charset="utf-8">
	<meta name="title" content="<?= $site_title; ?>"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
	<?php foreach($css as $link){
		echo '<link rel="stylesheet" href="'.$link.'">';
	} ?>
</head>
<body>
