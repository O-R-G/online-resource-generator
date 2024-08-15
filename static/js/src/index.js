import "./../../../config/fonts.js";
import "./../../../config/options.js";
import { Record } from "./Record.js";
import { Canvas } from "./Canvas.js";
import { ShapeStatic } from "./ShapeStatic.js";
import { ShapeAnimated } from "./ShapeAnimated.js";
import fontLoader from "./FontLoader.js";

const main = document.getElementById('main');
main.setAttribute('canvas-status', 'initializing');
if(!main.getAttribute('format') || typeof formatOptions[main.getAttribute('format')] === 'undefined') main.setAttribute('format', Object.keys(formatOptions)[0]);

/* fotmat font */



async function init(data, cb){
    console.log('main init()');
    // console.log(record_id);
    let format = main.getAttribute('format');
    main.setAttribute('format', format);
    let canvases = {};
    let shapes = {
        'animated': [],
        'static': []
    };
    // fontLoader.init();

    for(let id in data) {
        /* render canvas / shapes */
        let container = renderElements(id, data[id]);
        data[id]['container'] = container;
        let isThree = !(typeof data[id].isThree === 'undefined' || !data[id].isThree);
        main.appendChild( container );
        let wrapper = container.querySelector('.canvas-wrapper');
        let control = container.querySelector('.control-panel');
        let cvs = new Canvas(wrapper, format, id, {'formatOptions': formatOptions,'baseOptions': baseOptions}, data[id]['isThree']);
        let shape = isThree ? new ShapeAnimated(id, cvs, data[id]['options'], format) : new ShapeStatic(id, cvs, data[id]['options'], format);
        if (isThree) shapes['animated'].push(shape);
        else shapes['static'].push(shape);
        cvs.addShape(shape);
        cvs.addControl(control);
        data[id]['canvas'] = cvs;
        canvases[id] = cvs;
        cvs.init();
    }
    for(let id in data) {
        /* any counterparts? */
        for(let i in data) {
            if(i === data[id]['counterpart']) {
                data[id]['canvas'].addCounterpart(data[i]['canvas']);
                break;
            }
        }
        if(typeof data[id]['counterpart'] === 'undefined' || !data[id]['counterpart'] || typeof data[data[id]['counterpart']] == 'undefined') continue;
        let c = data[data[id]['counterpart']];
        for(let i = 0; i < Object.keys(data[id]['canvas']['shapes']).length; i++) {
            data[id]['canvas']['shapes'][Object.keys(data[id]['canvas']['shapes'])[i]].addCounterpart(c['canvas']['shapes'][Object.keys(c['canvas']['shapes'])[i]]);
        }
    }
    data[Object.keys(data)[0]]['canvas'].draw();
    
    // let uri = location.pathname.split('/');
    new Record(main, record_id, canvases);
    main.setAttribute('canvas-status', 'initialized');
    if(typeof cb === 'function') cb();
}

function renderElements(id, d){
    let container = document.createElement('div');
    container.id = id + '-container';
    container.className = 'generator-container';
    let isThree = !(typeof d.isThree === 'undefined' || !d.isThree);
    container.setAttribute('data-is-three', isThree);
    container.setAttribute('data-canvas-id', id);
    container.innerHTML = '<div class="control-panel"></div><div class="canvas-container"><div class="canvas-wrapper"></div></div>';

    return container;
}

let customScriptsByHook = {};
if(customScripts) {
    for(let item of customScripts) {
        let h = item['hook'];
        if(!customScriptsByHook[h])customScriptsByHook[h] = [];
        customScriptsByHook[h].push(item);
    }
}
function loadCustomScripts(scriptsObj, hook, cb){
    if(!scriptsObj[hook]) return;
    let firstScript = document.querySelector('script');
    let count = 0;
    for(let item of scriptsObj[hook]) {
        // console.log(localtion)
        let src = '/online-resource-generator/static/js/custom/' + item['name'] + '.js';
        let s = document.createElement('script');
        s.onload = ()=>{
            count++;
            if(count >= scriptsObj[hook].length && typeof cb === 'function') cb(); 
        }
        s.src = src;
        firstScript.parentNode.insertBefore(s, firstScript);
    }
}
// console.log(customScriptsByHook);
if(customScriptsByHook['beforeMainInit']) {
    let count = 0;
    let firstScript = document.querySelector('script');
    loadCustomScripts(customScriptsByHook, 'beforeMainInit', function(){
        init(resources_data, ()=>{
            loadCustomScripts(customScriptsByHook, 'afterMainInit');
        });
    });
    for(let item of customScriptsByHook['beforeMainInit']) {
        let src = location.pathname + '/static/js/custom/' + item['name'] + '.js';
        let s = document.createElement('script');
        s.onload = ()=>{
            count++;
            if(count >= customScriptsByHook.length) init(resources_data, ()=>{
                if(customScriptsByHook['afterMainInit']) {
                    let firstScript = document.querySelector('script');
                    for(let item of customScriptsByHook['afterMainInit']) {
                        let src = location.pathname + 'static/js/custom/' + item['name'] + '.js';
                        let s = document.createElement('script');
                        s.src = src;
                        firstScript.parentNode.insertBefore(s, firstScript);
                    }
                }
            });
        }
        s.src = src;
        firstScript.parentNode.insertBefore(s, firstScript);
    }
} else {
    init(resources_data, ()=>{
        loadCustomScripts(customScriptsByHook, 'afterMainInit');
    });
}

