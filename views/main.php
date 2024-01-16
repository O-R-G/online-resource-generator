<?

    /*  
        a view for making instagram and other social media graphics
    */
    // $mode = 'development';
    $isTestShapeAnimated = isset($_GET['isTestShapeAnimated']);
    $format = isset($_GET['format']) ? $_GET['format'] : ''; 

?><main id='main' <?= $format ? 'format="'.$format.'"' : ''; ?>>
    <!-- <section id='content' class='body'>
        <div id="static-container">
            <div id="panel-static-wrapper" class="control-panel"></div>
            <div class="canvas-container">
                <div id="canvas-static-wrapper" class=""></div>
            </div>
        </div>
        <div id="animated-container">
            <div id="panel-animated-wrapper" class="control-panel"></div>
            <div class="canvas-container">
                <div id="canvas-animated-wrapper" class=""></div>
            </div>
        </div>
    </section> -->
    <!-- preloaded fonts for canvas -->
    <div class="" style="font-family: standard-bold; font-weight: bold; opacity: 0; pointer-events: none; height: 0;">Bold</div>
    <div class="" style="font-family: standard-italic; opacity: 0; pointer-events: none; height: 0;">Italic</div>
</main>
<script src="config/options.js"></script>
<script type="module" src="static/js/dist/main.js"></script>