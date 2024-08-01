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
$fonts_root = __DIR__ . '/../static/fonts';
$fonts_dir = scandir($fonts_root);
$fonts = array();
// foreach($fonts_dir as $font_dir) {
// 	$font_dir_path = $fonts_root . '/' . $font_dir;
// 	if(substr($font_dir, 0, 1) === '.' || substr($font_dir, 0, 1) === '_' || !is_dir($font_dir_path)) continue;
// 	$files = scandir($font_dir_path);
// 	foreach($files as $f) {
// 		if(substr($f, 0, 1) == '.'|| is_dir($font_dir_path . '/' . $f)) continue;
// 		$ext = substr($f, strrpos($f, '.') + 1);
// 		if($ext === 'css') $css[] = 'static/fonts/' . $font_dir . '/' . $f;
// 		else {
// 			$fonts[] = '<link rel="preload" href="/online-resource-generator/static/fonts/' . $font_dir . '/' . $f.'" as="font" type="font/'.$ext.'" crossorigin>';
// 		}
// 	}
// }
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
	foreach($fonts as $font){
		echo $font;
	} 
	?>
</head>
<body>
