<?

    /*  
        a view for making instagram and other social media graphics
    */
    // $mode = 'development';
    // $isTestShapeAnimated = isset($_GET['isTestShapeAnimated']);
    $format = isset($_GET['format']) ? $_GET['format'] : ''; 
    $record = isset($uri[2]) ? $uri[2] : ''; 
    
    $temp = $oo->urls_to_ids($save_record_urls);
    if(count($temp) == count($save_record_urls)){
        $save_record = $oo->get(end($temp));
    }
        

?><main id='main' <?= $format ? 'format="'.$format.'"' : ''; ?>></main>
<script>
    const root_path = '<?php echo $root_path; ?>';
    const record_id = '<?php echo $record_id; ?>';
    const media_relative_root = '<?php echo $media_relative_root; ?>';
</script>
<script id="script-options" src="config/options.js"></script>
<script id="script-main" type="module" src="static/js/dist/main.js"></script>