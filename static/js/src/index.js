import { Canvas } from "./Canvas.js";
import { ShapeStatic } from "./ShapeStatic.js";
import { ShapeAnimated } from "./ShapeAnimated.js";
const main = document.getElementById('main');
if(!main.getAttribute('format') || typeof formatOptions[main.getAttribute('format')] === 'undefined') main.setAttribute('format', Object.keys(formatOptions)[0]);
function init(data){
    let format = main.getAttribute('format');
    // main.classList.remove('waiting-for-format');
    main.setAttribute('format', format);
    // renderElements(main, data);
    for(let id in data) {
        /* render canvas / shapes */
        let container = renderElements(id, data[id]);
        data[id]['container'] = container;
        let isThree = !(typeof data[id].isThree === 'undefined' || !data[id].isThree);
        main.appendChild( container );
        let wrapper = container.querySelector('.canvas-wrapper');
        let control = container.querySelector('.control-panel');
        let cvs = new Canvas(wrapper, format, 'canvas-' + id, {'formatOptions': formatOptions,'baseOptions': baseOptions}, data[id]['isThree']);
        data[id]['canvas'] = cvs;
        cvs.addControl(control);        
        let shapeCenter = isThree ? {x: 0, y: 0} : {x: cvs['canvas'].width / 2, y: cvs['canvas'].height / 2};
        // let frame = generateFrame(shapeCenter.x, shapeCenter.y, cvs.canvas.width, cvs.canvas.height, 1, isThree);
        // let shape = isThree ? new ShapeAnimated('shape-' + id, cvs, data[id]['options'], control, format, frame) : new ShapeStatic('shape-' + id, cvs, data[id]['options'], control, format, frame);
        let shape = isThree ? new ShapeAnimated('shape-' + id, cvs, data[id]['options'], control, format) : new ShapeStatic('shape-' + id, cvs, data[id]['options'], control, format);
        cvs.shapes.push(shape);
    }
    for(let id in data) {
        /* any counterparts? */
        for(let i in data) {
            if(i === id) continue;
            data[id]['canvas'].addCounterpart(data[i]['canvas']);
        }
        if(typeof data[id]['counterpart'] === 'undefined' || !data[id]['counterpart'] || typeof data[data[id]['counterpart']] == 'undefined') continue;
        // console.log('11');
        // console.log(data[id]['canvas']['counterpart'])
        let c = data[data[id]['counterpart']];
        console.log(c);
        for(let i = 0; i < data[id]['canvas']['shapes'].length; i++) {
            console.log(data[id]['canvas']['shapes'][i]);
            data[id]['canvas']['shapes'][i].addCounterpart(c['canvas']['shapes'][i]);
        }
    }
    data[Object.keys(data)[0]]['canvas'].draw();
}

function renderElements(id, d){
    let container = document.createElement('div');
    container.id = id + '-container';
    container.className = 'generator-container';
    let isThree = !(typeof d.isThree === 'undefined' || !d.isThree);
    container.setAttribute('data-is-three', isThree);
    container.innerHTML = '<div class="control-panel"></div><div class="canvas-container"><div class="canvas-wrapper"></div></div>';

    return container;
}

function generateFrame(centerX, centerY, canvasW, canvasH, shapeAmount, isThree = false)
{
    let output = {};
    // assuming vertically stacking only
    let unit_w = canvasW;
    let unit_h = canvasH / shapeAmount;
    let length = unit_w > unit_h ? unit_h : unit_w;
    output.w = length;
    output.h = length;
    output.x = !isThree ? centerX - output.w / 2 : centerX;
    output.y = !isThree ? centerY - output.h / 2 : centerY;
    return output;
}


init(resources_data);