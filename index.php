<?php
$request = $_SERVER['REQUEST_URI'];
$requestclean = strtok($request,"?");
$uri = explode('/', $requestclean);

if(empty(end($uri))){
	array_pop($uri);
}

require_once("views/head.php");
if($uri[1] === 'helper')
	require_once("views/helper.php");
else
	require_once("views/main.php");
require_once("views/foot.php");
?>
