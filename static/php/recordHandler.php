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

$temp = $oo->urls_to_ids($save_record_urls);
if(count($temp) !== count($save_record_urls)) {
    // var_dump($temp);
    $response['body'] = 'The record specified with $save_record_urls does not exist';
    exit(json_encode($response));
}
$main_record_id = end($temp);
$save_record = $oo->get($main_record_id);
$action = $_POST['action'];
if ($action == 'insert') :
    // $urlIsValid = true;
    // $url = '';
    // function insert_object(&$new, $siblings)
    // {
    //     global $oo;
    //     global $url;
    //     global $urlIsValid;

    //     // set default name if no name given
    //     if(!$new['name1'])
    //         $new['name1'] = 'untitled';

    //     // slug-ify url
    //     if(isset($new['url']) && !empty($new['url']))
    //         $new['url'] = slug($new['url']);
    //     else
    //         $new['url'] = slug($new['name1']);

    //     // make sure url doesn't clash with urls of siblings
    //     $s_urls = array();
    //     foreach($siblings as $s_id)
    //         $s_urls[] = $oo->get($s_id)['url'];

    //     $url = $new['url'];
    //     // make mysql happy with nulls and such
    //     foreach($new as $key => $value)
    //     {
    //         if($value)
    //             $new[$key] = "'".$value."'";
    //         else
    //             $new[$key] = "null";
    //     }

    //     $record_id = $oo->insert($new);
        
    //     $u = str_replace("'", "", $new['url']);
    //     $urlIsValid = validate_url($u, $s_urls);
    //     if( !$urlIsValid )
    //     {
    //         $url = valid_url($u, strval($record_id), $s_urls);
    //         $new['url'] = "'".$url."'";
    //         $oo->update($record_id, $new);
    //     }

    //     return $record_id;
    // }
    $sql = "SELECT objects.url FROM objects, wires WHERE objects.active = 1 AND wires.active = 1 AND wires.toid = objects.id AND wires.fromid = $main_record_id";
    $sibling_urls = array();
    $result = $db->query($sql);
    while($obj = $result->fetch_assoc()) $sibling_urls[] = $obj['url'];
    $name1 = $_POST['record_name'] ? addslashes($_POST['record_name']) : 'untitled';
    $record_body = $_POST['record_body'] ? addslashes($_POST['record_body']) : '';
    $url = slug($name1);
    $url_test = $url;
    $url_index = 1;
    // var_dump($sibling_urls);
    while( in_array($url_test, $sibling_urls) ) {
        $url_test = $url . '-' . $url_index;
        $url_index++;
    }
    $url = $url_test;
    // var_dump($url);
    $sql = "INSERT INTO `objects` (`name1`, `body`, `url`) VALUES ('$name1', '$record_body', '$url')";
    $db->query($sql);
    $record_id = $db->insert_id;
    $ww->create_wire($main_record_id, $record_id);
    
    $response['status'] = 'success';
    $response['body'] = '/online-resource-generator/' . $url;
elseif ($action == 'get'):
    $record_id = $_POST['record_id'];
    $sql = "SELECT objects.body, objects.id, objects.url FROM objects, wires WHERE objects.id = $record_id AND objects.id = wires.toid AND objects.active='1' AND wires.active='1' AND wires.fromid = $main_record_id LIMIT 1";
    $res = $db->query($sql);
    if($res->num_rows == 0) {
        $response['body'] = 'fail to find a record of this url';
        exit(json_encode($response));
    }
        
    $item = $res->fetch_assoc();
    $res->close();
    $response['status'] = 'success';
    $response['body'] = $item['body'];
    // $response['id'] = $item['id'];
    // $response['url'] = $item['url'];
    // exit(json_encode($response));
elseif ($action == 'save'):
    $record_id = $_POST['record_id'];
    $record_body = addslashes($_POST['record_body']);
    $sql = "UPDATE objects JOIN wires ON objects.id = wires.toid SET objects.body='$record_body' WHERE objects.active = '1' AND wires.active = '1' AND wires.fromid = $main_record_id AND objects.id = $record_id";
    $res = $db->query($sql);
    $response['status'] = 'success';
    $response['body'] = 'save success';
    
endif;

if(!empty($_FILES)) {
    $record_body_json = json_decode($_POST['record_body'], true);
    $record_body_json['images'] = array();
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