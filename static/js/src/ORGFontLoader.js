// import { FontLoader as threeFontLoader } from 'three/addons/loaders/FontLoader.js';

export default class ORGFontLoader {
	constructor(fonts_data){
        this.fonts_data = fonts_data;
        this.loaded_css = [];
        this.init();
	}
    init(cb){
        for(const key in this.fonts_data) {
            this.addStylesheet(this.fonts_data[key]['stylesheet']);
            this.addDummyDiv(this.fonts_data[key]['style']);
        }
        if (typeof cb === 'function') cb();
    }
    addStylesheet(path){
        if(this.loaded_css.includes(path)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
        this.loaded_css.push(path)
    }
    addDummyDiv(style){
        let style_str = '';
        for(let prop in style) {
            if(!style[prop]) continue;
            style_str += `font-${prop}: ${style[prop]}; `;
        }
        let temp = document.createElement('div');
        temp.innerHTML = '&nbsp;';
        temp.style = style_str;
        document.body.appendChild(temp);
    }
}