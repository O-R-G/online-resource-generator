// import { FontLoader as threeFontLoader } from 'three/addons/loaders/FontLoader.js';

export class FontLoader {
	constructor(fonts_data){
        this.styles = fonts_data['styles'];
        this.stylesheets = fonts_data['stylesheets'];
        this.files = fonts_data['files'];
        this.init();
	}
    init(cb){
        this.addStylesheets();
        this.preloadFonts();
        this.addDummyDivs();
        if (typeof cb === 'function') cb();
    }
    addStylesheets(){
        if(!this.stylesheets) return;
        for(let path of this.stylesheets) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path
            document.head.appendChild(link);
        }
    }
    addDummyDivs(){
        if(!this.styles) return;
        for(let style of this.styles) {
            let style_str = '';
            for(let prop in style) {
                if(!style[prop]) continue;
                style_str += `font-${prop}: ${style[prop]}`;
            }
            let temp = document.createElement('div');
            temp.innerHTML = '&nbsp;';
            temp.style = style_str;
            document.body.appendChild(temp);
        }
    }
    preloadFonts(){
        if(!this.files) return;
        for(let file of this.files) {
            let path = file['path'];
            let type = file['type'];
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = path;
            link.as = 'font';
            link.type = type;
            link.crossorigin = true;
            document.head.appendChild(link);
        }
        
    }   
}
const fontLoaderInstance = new FontLoader(fonts, '');
export default fontLoaderInstance;