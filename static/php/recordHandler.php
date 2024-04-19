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
    var_dump($temp);
    $response['body'] = 'The record specified with $save_record_urls does not exist';
    exit(json_encode($response));
}
$main_record_id = end($temp);
$save_record = $oo->get($main_record_id);
$action = $_POST['action'];
if ($action == 'insert') :
    $urlIsValid = true;
    $url = '';
    function insert_object(&$new, $siblings)
    {
        global $oo;
        global $url;
        global $urlIsValid;

        // set default name if no name given
        if(!$new['name1'])
            $new['name1'] = 'untitled';

        // slug-ify url
        if(isset($new['url']) && !empty($new['url']))
            $new['url'] = slug($new['url']);
        else
            $new['url'] = slug($new['name1']);

        // make sure url doesn't clash with urls of siblings
        $s_urls = array();
        foreach($siblings as $s_id)
            $s_urls[] = $oo->get($s_id)['url'];

        // deal with dates
        // if(!empty($new['begin']))
        // {
        //     $dt = strtotime($new['begin']);
        //     $new['begin'] = date($oo::MYSQL_DATE_FMT, $dt);
        // }

        // if(!empty($new['end']))
        // {
        //     $dt = strtotime($new['end']);
        //     $new['end'] = date($oo::MYSQL_DATE_FMT, $dt);
        // }
        $url = $new['url'];
        // make mysql happy with nulls and such
        foreach($new as $key => $value)
        {
            if($value)
                $new[$key] = "'".$value."'";
            else
                $new[$key] = "null";
        }

        $id = $oo->insert($new);
        
        // need to strip out the quotes that were added to appease sql
        $u = str_replace("'", "", $new['url']);
        $urlIsValid = validate_url($u, $s_urls);
        if( !$urlIsValid )
        {
            $url = valid_url($u, strval($id), $s_urls);
            $new['url'] = "'".$url."'";
            $oo->update($id, $new);
        }

        return $id;
    }
    $siblings = $oo->children_ids($main_record_id);
    
    $arr = array('name1' => addslashes($_POST['record_name']), 'body' => addslashes($_POST['record_body']));
    $id = insert_object($arr, $siblings);
    $ww->create_wire($main_record_id, $id);
    
    $response['status'] = 'success';
    $response['body'] = '/online-resource-generator/' . $url;
    exit(json_encode($response));
elseif ($action == 'get'):
    $sql = "SELECT objects.body FROM objects, wires WHERE objects.url = '" . $_POST['url'] . "' AND objects.id = wires.toid AND objects.active='1' AND wires.active='1' AND wires.fromid = $main_record_id LIMIT 1";
    $res = $db->query($sql);
    if($res->num_rows == 0) {
        $response['body'] = 'fail to find a record of this url';
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