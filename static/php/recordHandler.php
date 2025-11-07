<?php
require_once(__DIR__ . '/../../config/config.php');
require_once(__DIR__ . '/../../../open-records-generator/config/config.php');
$oo = new Objects();
$ww = new Wires();
$db = db_connect('admin');

if (empty($_POST)) 
    exit('nothing here . . .');

$response = array(
    'status' => 'error',
    'body' => ''
);

$temp = $oo->urls_to_ids($root_database);
if(count($temp) !== count($root_database)) {
    $response['body'] = 'The record specified with $root_database does not exist';
    exit(json_encode($response));
}
$main_record_id = end($temp);
$save_record = $oo->get($main_record_id);
$action = $_POST['action'];
if ($action == 'insert') :
    $sql = "SELECT objects.url FROM objects, wires WHERE objects.active = 1 AND wires.active = 1 AND wires.toid = objects.id AND wires.fromid = $main_record_id";
    $sibling_urls = array();
    $result = $db->query($sql);
    while($obj = $result->fetch_assoc()) $sibling_urls[] = $obj['url'];
    $name1 = $_POST['record_name'] ? addslashes($_POST['record_name']) : 'untitled';
    $record_body = $_POST['record_body'] ? addslashes($_POST['record_body']) : '';
    $record_notes = $_POST['format'] ? addslashes($_POST['format']) : '';
    // $format_query = isset($_POST['format']) && $_POST['format'] ? '?format=' . $_POST['format'] : '';
    $format_query = '';
    $url_base = slug($name1) ;
    $url_test = $url_base . $format_query;
    $url_index = 1;
    while( in_array($url_test, $sibling_urls) ) {
        $url_test = $url_base . '-' . $url_index . $format_query;
        $url_index++;
    }
    $url = $url_test;
    $sql = "INSERT INTO `objects` (`name1`, `body`, `notes`, `url`) VALUES ('$name1', '$record_body', '$record_notes', '$url')";
    $db->query($sql);
    $record_id = $db->insert_id;
    $ww->create_wire($main_record_id, $record_id);
    
    $response['status'] = 'success';
    $response['body'] = '/online-resource-generator/' . $url;
elseif ($action == 'get'):
    $record_id = $_POST['record_id'];
    $sql = "SELECT `body`, `id`, `url` FROM objects WHERE id = $record_id AND active='1' LIMIT 1";
    $res = $db->query($sql);
    if($res->num_rows == 0) {
        $response['body'] = 'fail to find a record of this url';
        exit(json_encode($response));
    }
        
    $item = $res->fetch_assoc();
    $res->close();
    $response['status'] = 'success';
    $response['body'] = $item['body'];
elseif ($action == 'save'):
    $record_id = $_POST['record_id'];
    $record_body = addslashes($_POST['record_body']);
    $record_notes = $_POST['format'] ? addslashes($_POST['format']) : '';
    $sql = "UPDATE objects SET body='$record_body', notes='$record_notes' WHERE id = $record_id";
    $res = $db->query($sql);
    $response['status'] = 'success';
    $response['body'] = 'save success';
    
endif;

if(!empty($_FILES)) {
    $record_body_json = json_decode($_POST['record_body'], true);
    if(!isset($record_body_json['images'])) $record_body_json['images'] = array();
    foreach($_FILES as $key => $file) {
        if($file['error'] !== UPLOAD_ERR_OK) continue;
        // var_dump($key);
        $m_arr = array();
        $tmp_name = $_FILES[$key]["tmp_name"];
        $m_name = $_FILES[$key]["name"];
        $temp = explode(".", $m_name);
        $m_type = strtolower(end($temp));

        $m_arr["type"] = "'".$m_type."'";
        $m_arr["object"] = "'".$record_id."'";

        $m_arr_keys = implode(',', array_keys($m_arr));
        $m_arr_vals = implode(',', array_values($m_arr));

        $sql = "INSERT INTO `media` ($m_arr_keys) VALUES ($m_arr_vals)";
        $db->query($sql);
        $m_id = $db->insert_id;
        $m_file = m_pad($m_id).".".$m_type;
        $m_dest = $media_root;
        $m_dest.= $m_file;
        try{
            move_uploaded_file($tmp_name, $m_dest);
            $record_body_json['images'][$key] = $m_file;
            // $counterpart_key = str_replace('static-', 'animated-', $key);
            // if(!isset($record_body_json['images'][$counterpart_key])) 
            //     $record_body_json['images'][$counterpart_key] = $m_file;
        } catch(Exception $e) {
            var_dump($e);
        }
        
    }
    if(!empty($record_body_json['images'])) {
        $record_body = addslashes(json_encode($record_body_json));
        $sql = "UPDATE objects SET body = '$record_body' WHERE id = $record_id";
        $db->query($sql);
    }
}
// var_dump($_FILES);


exit(json_encode($response));