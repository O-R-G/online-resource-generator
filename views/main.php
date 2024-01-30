<?

    /*  
        a view for making instagram and other social media graphics
    */
    // $mode = 'development';
    $isTestShapeAnimated = isset($_GET['isTestShapeAnimated']);
    $format = isset($_GET['format']) ? $_GET['format'] : ''; 

?><main id='main' <?= $format ? 'format="'.$format.'"' : ''; ?>></main>
<script src="config/options.js"></script>
<script type="module" src="static/js/dist/main.js"></script>