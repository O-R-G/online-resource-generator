<?

    /*  
        a view for making instagram and other social media graphics
    */
    // $mode = 'development';
    $isTestShapeAnimated = isset($_GET['isTestShapeAnimated']);
    $format = isset($_GET['format']) ? $_GET['format'] : ''; 

?><main id='main' <?= $format ? 'format="'.$format.'"' : ''; ?>></main>
<script id="script-options" src="config/options.js"></script>
<script id="script-main" type="module" src="static/js/dist/main.js"></script>