export function getDefaultOption(options, returnKey = false){
    for(let key in options) {
        if(options[key]['default']) {
            return returnKey ? key : options[key];
        }
    }
    return returnKey ? Object.keys(options)[0] : options[Object.keys(options)[0]];
}
export function getClassString(arr){
    return arr.join(' ');
};
export function addExtraAttr(el, attrs){
    if(!attrs) return el;
    for(let prop in attrs) {
        if(attrs[prop] === '' || attrs[prop] == true) {
            el.setAttribute(prop, true);
        } else {
            el.setAttribute(prop, attrs[prop]);
        }
    }
    return el;
};
export function initMediaStatic(key, values={}){
    let output = {
        obj: null,
        src: '',
        x: 0,
        y: 0,
        'shift-y': 0,
        'shift-x': 0,
        scale: 1,
        'blend-mode': 'normal',
        isShapeColor: false
    };
    for(const prop in values) {
        if(typeof output[prop] === 'undefined') continue;
        output[prop] = values[prop];
    }
    return output;
}

export function generateFieldId(id, key){
    return id + '-field-id-' + key;
}
export function toFix(val, digits=2){
    let output = parseFloat(val).toFixed(digits);
    return parseFloat(output);
}
export function updatePositionByKey(e, inputs, cb){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    let val = e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1.0 : 1.0;
    val *= e.shiftKey ? 10 : 1;
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if(!inputs.y.value) inputs.y.value = 0;
        inputs.y.value = toFix(inputs.y.value) + val;
    } else if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if(!inputs.x.value) inputs.x.value = 0;
        inputs.x.value = toFix(inputs.x.value) + val;
    }
    inputs.x.classList.add('pseudo-focused');
    inputs.y.classList.add('pseudo-focused');
    if(typeof cb === 'function') cb({x: inputs.x.value, y: inputs.y.value});
}