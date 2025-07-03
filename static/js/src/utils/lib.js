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
    for(let prop in attrs) {
        if(attrs[prop] === '' || attrs[prop] == true) {
            el.setAttribute(prop, true);
        } else {
            el.setAttribute(prop, attrs[prop]);
        }
    }
    return el;
};