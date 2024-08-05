<?php
    $format = isset($_GET['format']) ? $_GET['format'] : ''; 
    $media_relative_root = str_replace($root, '/', $media_root);
    $filename = $record_id ? $oo->get($record_id)['url'] : '';
    $filename = $filename ? 'filename="' . $filename . '"' : ''
?><main id='main' <?= $format ? 'format="'.$format.'"' : ''; ?> <?php echo $filename; ?>></main>
<!-- <div style="font-family: 'standard'; ">&nbsp;</div>
<div style="font-family: 'standard'; font-weight: bold; ">&nbsp;</div> -->
<canvas id="canvas"></canvas>
<script>
    const root_path = '<?php echo $root_path; ?>';
    const record_id = '<?php echo $record_id; ?>';
    const media_relative_root = '<?php echo $media_relative_root; ?>';
</script>
<script id="script-options" src="<?php echo $root_path; ?>/config/options.js"></script>
<script id="script-fonts" src="<?php echo $root_path; ?>/config/fonts.js"></script>
<script id="script-main" type="module" src="<?php echo $root_path; ?>/static/js/dist/main.js?<?php echo rand(0, 10000); ?>"></script>
<style>
    body {
        background-color: #fff;
    }
</style>