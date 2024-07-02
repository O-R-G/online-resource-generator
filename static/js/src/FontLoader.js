import { FontLoader as threeFontLoader } from 'three/addons/loaders/FontLoader.js';

export class FontLoader {
	constructor(font_data, root_path, three_cb){
        this.font_data = font_data;
        this.root_path = root_path;
        // this.root_path = '/qqq';
        this.three_cb = three_cb;
        this.three_toload = 0;
        this.three_loaded = false;
        this.three_promise = null;
        for(let data of this.font_data) {
            if(!data.isThree) continue;
            this.three_toload++;       
        }
        this.fonts = {
            'animated': {}
        }
        this.threeFontLoader = new threeFontLoader();
        this.init();
	}
    init(){
        for(let data of this.font_data) {
            if(!data.isThree)
                this.loadFont(data);
        }
        // this.loadThreeFonts();
    }
    loadFont(data){
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.root_path + data['path'];
        document.head.appendChild(link);
        
    }
    loadThreeFonts(){
        if (!this.three_promise) {
            let three_fonts = this.font_data.filter(function(data) {
                if (!data.isThree) {
                  return false; // skip
                }
                return true;
            });
            console.log(three_fonts);
            this.three_promise = Promise.all(three_fonts.map(font => this.loadThreeFont(font)));
        }
        return this.three_promise;
        
                
    }
    loadThreeFont(data){
        console.log('loadThreeFont');
        console.log(data['path']);
        return new Promise((resolve, reject) => {
            this.threeFontLoader.load( this.root_path + data['path'], ( font ) => {
                console.log('three font loaded');
                this.fonts.animated[data['name']] = font;
                this.three_toload--;
                if(this.three_toload === 0) this.three_loaded = true;
                resolve({'name': data['name'], 'font': font, 'path': this.root_path + data['path']});
            });
        });
        
		// this.threeFontLoader.load( 'static/fonts/_threejs/Standard_Bold.json', function ( font ) {
		// 	this.font_bold = font;
		// }.bind(this));
    }
    
}
const fontLoaderInstance = new FontLoader(fonts, root_path);
export default fontLoaderInstance;