<?php
    // $format = isset($_GET['format']) ? $_GET['format'] : ''; 
    $format = isset($_GET['format']) ? $_GET['format'] : ($saved_record['notes'] ?? '');
    $media_relative_root = str_replace($root, '/', $media_root);
    $filename = $record_id ? $oo->get($record_id)['url'] : '';
    $filename = $filename ? 'filename="' . $filename . '"' : '';
    $action = isset($_GET['action']) ? $_GET['action'] : '';
?><main id='main' <?= $format ? 'format="'.$format.'"' : ''; ?> <?php echo $filename; ?>></main>
<script>
    const format = '<?php echo isset($_GET['format']) ? $_GET['format'] : ($saved_record['notes'] ?? ''); ?>';
    const params = new URL(document.location).searchParams;
    const format_param = params.get("format") ? params.get("format") : ''; 
    if(format_param != format) {
        // Get the current URL
        const currentUrl = new URL(window.location.href);

        // Create a URLSearchParams object from the current query string
        const params = new URLSearchParams(currentUrl.search);

        // Add or update a query parameter
        params.set('format', format);

        // Construct the new URL with the updated query string
        currentUrl.search = params.toString();

        // Update the URL in the browser without reloading the page
        window.history.replaceState({}, '', currentUrl.toString());
        // history.replaceState(null, null, url)
    }
    const root_path = '<?php echo $root_path; ?>';
    const record_id = '<?php echo $record_id; ?>';
    const media_relative_root = '<?php echo $media_relative_root; ?>';
    const action = '<?php echo $action; ?>';
    
</script>
<script id="script-fonts" src="<?php echo $root_path; ?>/config/fonts.js"></script>
<script id="script-options" src="<?php echo $root_path; ?>/config/options.js"></script>
<script id="script-main" type="module" src="<?php echo $root_path; ?>/static/js/dist/main.js?<?php echo rand(0, 10000); ?>"></script>