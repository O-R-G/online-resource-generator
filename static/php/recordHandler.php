<?php
require_once(__DIR__ . '/../../config/config.php');
require_once(__DIR__ . '/../../../open-records-generator/config/config.php');
$oo = new Objects();
$db = db_connect('admin');

if (empty($_POST)) 
    exit('nothing here . . .');

$response = array(
    'status' => 'error',
    'body' => ''
);

$temp = $oo->urls_to_ids($save_record_urls);
if(count($temp) !== count($save_record_urls)) {
    var_dump($temp);
    $response['body'] = 'The record specified with $save_record_urls does not exist';
    exit(json_encode($response));
}
$save_record_id = end($temp);
$save_record = $oo->get($save_record_id);
$action = $_POST['action'];
if ($action == 'insert') :
    $arr = array('name1' => 'new poster', 'url' => 'new-poster');
    $sql = "INSERT INTO objects (" . implode(',', array_keys($arr)) . ") VALUES ('" . implode("','", array_values($arr)) ."')";
    $db->query($sql);
    $id = $db->insert_id;
    $sql = "UPDATE objects SET name1='new poster ($id)', url='new-poster-$id' WHERE id='$id'";
    $db->query($sql);
    $sql = "INSERT INTO wires (fromid, toid) VALUES ($save_record_id, $id)";
    $db->query($sql);
    $response['status'] = 'success';
    $response['body'] = '/online-resource-generator?record=' . $id;
    exit(json_encode($response));
elseif ($action == 'get'):
    $sql = "SELECT objects.body FROM objects, wires WHERE objects.id = " . $_POST['id'] . " AND objects.id = wires.toid AND wires.fromid = $save_record_id LIMIT 1";
    $res = $db->query($sql);
    if($res->num_rows == 0) {
        $response['body'] = 'fail to find a record of this id';
        exit(json_encode($response));
    }
        
    $item = $res->fetch_assoc();
    $res->close();
    $response['status'] = 'success';
    $response['body'] = $item['body'];
    exit(json_encode($response));

elseif ($action == 'save'):
    $record_body = addslashes($_POST['record_body']);
    $id = $_POST['record_id'];
    $sql = "UPDATE objects SET body='$record_body' WHERE id=$id";
    $res = $db->query($sql);
    $response['status'] = 'success';
    $response['body'] = 'save success';
    exit(json_encode($response));
endif;