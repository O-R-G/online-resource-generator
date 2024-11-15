export function getDefaultOption(options, returnKey = false){
    for(let key in options) {
        if(options[key]['default']) {
            return returnKey ? key : options[key];
        }
    }
    return returnKey ? Object.keys(options)[0] : options[Object.keys(options)[0]];
}