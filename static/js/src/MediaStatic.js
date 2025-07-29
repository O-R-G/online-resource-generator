import {initMediaStatic} from "./utils/lib.js"
export default class MediaStatic{
    constructor(key, shape, values){
        super(key, shape, values);
        this.template = {
            obj: null,
            src: '',
            x: 0,
            y: 0,
            shiftY: 0,
            shiftX: 0,
            scale: 1,
            'blend-mode': 'normal',
            isShapeColor: false
        }
        this.isThree = false;
        this.update(values);
    }
    update(values){
        super.update(values);
    }
}