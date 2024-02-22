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
    console.log(main.offsetWidth);
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

    // const wrapper_static = document.getElementById('canvas-static-wrapper');
    // const wrapper_animated = document.getElementById('canvas-animated-wrapper');
    // canvas_static = new Canvas(wrapper_static, format, 'canvas-static', {'baseOptions': baseOptions});
    // canvas_animated = new Canvas(wrapper_animated, format, 'canvas-three', {'baseOptions': baseOptions}, true);
    // canvas_static.addCounterpart(canvas_animated);
    // canvas_animated.addCounterpart(canvas_static);
    // panel_static_wrapper = document.getElementById('panel-static-wrapper');
    // panel_animated_wrapper = document.getElementById('panel-animated-wrapper');
    // canvas_static.addControl(panel_static_wrapper);
    // canvas_animated.addControl(panel_animated_wrapper);
    // var shapeStaticCenter = {
    //     x: canvas_static.canvas.width / 2,
    //     y: canvas_static.canvas.height / 2
    // };

    // var staticShapeFrame = generateFrame(shapeStaticCenter.x, shapeStaticCenter.y, canvas_static.canvas.width, canvas_static.canvas.height, 1);
    // var shapeAnitmatedCenter = {
    //     x: 0,
    //     y: 0
    // };
    // var animatedShapeFrame = generateFrame(shapeAnitmatedCenter.x, shapeAnitmatedCenter.y, canvas_animated.canvas.width, canvas_animated.canvas.height, 1, true);
    // canvas_static.shapes.push(   new ShapeStatic('staticShape-1',     canvas_static, options, panel_static_wrapper, format, staticShapeFrame) );

    // canvas_animated.shapes.push( new ShapeAnimated('animatedShape-1', canvas_animated, options_three, panel_animated_wrapper, format, animatedShapeFrame) );
    // canvas_static.shapes[0].addCounterpart(canvas_animated.shapes[0]);
    // canvas_animated.shapes[0].addCounterpart(canvas_static.shapes[0]);
    // console.log('drawing static from index.js');
    // canvas_static.draw();

    /*
        experimental load record by url
    */

    // var pathname = new URL(window.location.href).pathname;
    // const path = pathname.split("/");
    // var _url = path[2];
    // if (_url) {
    //     console.log('requestRecordByURL() with ' + _url);
    //     canvas_static.requestRecordByURL(null, _url, false);
    // }
}

function applyValueFromRecord(json){
    
}

function renderElements(id, d){
    let container = document.createElement('div');
    container.id = id + '-container';
    container.className = 'generator-container';
    let isThree = !(typeof d.isThree === 'undefined' || !d.isThree);
    container.setAttribute('data-is-three', isThree);
    container.innerHTML = '<div class="control-panel"></div><div class="canvas-container"><div class="canvas-wrapper"></div></div>';
    // let panel = document.createElement('div');
    // panel.id = d.id + '-control-panel';
    // panel.className = 'contorl-panel';
    // let canvas_container = document.createElement('div');
    // canvas_container.className = 'canvas-container';
    // let canvas_wrapper = document.createElement('div');
    // canvas_wrapper.className = 'canvas-wrapper';
    // canvas_container.appendChild(canvas_wrapper);
    // container.appendChild(panel);
    // container.appendChild(canvas_container);
    // main.appendChild(container);

    return container;
}

// function renderSelect(id, options, extraClass=''){
//     let temp_select = document.createElement('SELECT');
//     temp_select.id = id;
//     temp_select.className = extraClass;
//     if(typeof options === 'object' && options !== null)
//     {
//         for (const [key, value] of Object.entries(options)) {
//             let temp_option = document.createElement('OPTION');
//             temp_option.value = key;
//             temp_option.innerText = value['name'];
//             temp_select.appendChild(temp_option);
//         }
//     }
//     return temp_select;
// }
// function renderSelectField(id, displayName, options, extraClass='')
// {
//     let temp_panel_section = document.createElement('DIV');
//     temp_panel_section.className  = "panel-section float-container " + extraClass;
//     let temp_label = document.createElement('LABEL');
//     temp_label.setAttribute('for', id);
//     temp_label.innerText = displayName;
//     let temp_select = renderSelect(id, options);
//     temp_panel_section.appendChild(temp_label);
//     temp_panel_section.appendChild(temp_select);
//     return temp_panel_section;
// }
// function renderTextField(id, displayName, textColorOptions, fontOptions, extraClass='')
// {
//     let temp_panel_section = document.createElement('DIV');
//     temp_panel_section.className  = "panel-section float-container " + extraClass;
//     let temp_label = document.createElement('LABEL');
//     temp_label.setAttribute('for', id);
//     temp_label.innerText = displayName;
//     let temp_textarea = document.createElement('TEXTAREA');
//     temp_textarea.id = id;
//     temp_textarea.setAttribute('rows', 3);
//     let temp_select_textColor = renderSelect(id + '-color', textColorOptions, 'flex-item typography-flex-item');
//     let temp_select_font = renderSelect(id + '-font', fontOptions, 'flex-item typography-flex-item');
//     let flex_container = document.createElement('DIV');
//     flex_container.className = 'flex-container typography-control';
//     flex_container.appendChild(temp_textarea);
//     flex_container.appendChild(temp_select_textColor);
//     flex_container.appendChild(temp_select_font);
//     temp_panel_section.appendChild(temp_label);
//     temp_panel_section.appendChild(flex_container);
//     return temp_panel_section;
// }

// var watermarkidx = 0;
// function renderWatermark(idx, extraClass='')
// {
//     let id = 'watermark-' + idx;
//     let displayName = 'Watermark';
//     let temp_panel_section = document.createElement('DIV');
//     temp_panel_section.className  = "panel-section float-container " + extraClass;
//     let temp_label = document.createElement('LABEL');
//     temp_label.setAttribute('for', id);
//     temp_label.innerText = displayName;
//     let temp_right = document.createElement('DIV');
//     temp_right.className = 'flex-container typography-control';
//     let temp_input = document.createElement('INPUT');
//     temp_input.type = 'text';
//     temp_input.className = 'watermark';
//     temp_input.id = id;
//     temp_right.appendChild(temp_input);

//     let temp_select_position = renderSelect('watermark-position-' + idx, watermarkPositionOptions, 'watermark-position flex-item typography-flex-item');
//     temp_right.appendChild(temp_select_position);

//     let temp_select_color = renderSelect('watermark-color-' + idx, textColorOptions, 'watermark-color flex-item typography-flex-item');
//     temp_right.appendChild(temp_select_color);

//     let temp_select_fontSize = renderSelect('watermark-fontsize-' + idx, fontOptions, 'watermark-fontsize flex-item typography-flex-item');
//     temp_right.appendChild(temp_select_fontSize);

//     temp_input.onchange = function(e){
//         shapeObj.updateWatermark(idx, e.target.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value);
//         shapeAnimatedObj.updateWatermark(idx, e.target.value, temp_select_position.value, temp_select_color.value, temp_select_fontSize.value);
//     };
//     temp_select_position.onchange = function(e){

//         checkWatermarkPosition(shapeOptions[sShape.value].shape.watermarkPositions, e.target.value, temp_label);
//         shapeObj.updateWatermark(idx, temp_input.value, e.target.value, temp_select_color.value, temp_select_fontSize.value);
//         shapeAnimatedObj.updateWatermark(idx, temp_input.value, e.target.value, temp_select_color.value, temp_select_fontSize.value);
//     };
//     temp_select_color.onchange = function(e){
//         shapeObj.updateWatermark(idx, temp_input.value, temp_select_position.value, e.target.value, temp_select_fontSize.value);
//         shapeAnimatedObj.updateWatermark(idx, temp_input.value, temp_select_position.value, e.target.value, temp_select_fontSize.value);
//     };
//     temp_select_fontSize.onchange = function(e){
//         shapeObj.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, e.target.value);
//         shapeAnimatedObj.updateWatermark(idx, temp_input.value, temp_select_position.value, temp_select_color.value, e.target.value);
//     };

//     temp_panel_section.appendChild(temp_label);
//     temp_panel_section.appendChild(temp_right);
//     return temp_panel_section;
// }

// function updateCounterpartSelect(selectElement, value){
//     let options = selectElement.querySelectorAll('option');
//     [].forEach.call(options, function(el, i){
//         if(el.value == value)
//             el.selected = 'selected';                    
//     });
// }

// var viewingThree = false;

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



var options = {
    'shapeOptions': shapeOptions,
    'colorOptions': colorOptions,
    'fontOptions': fontOptions,
    'textColorOptions': textColorOptions,
    'watermarkColorOptions': textColorOptions,
    'animationOptions': animationOptions,
    'textPositionOptions': textPositionOptions,
    'watermarkPositionOptions': watermarkPositionOptions
    
};
var options_three = {
    'shapeOptions': shapeOptions,
    'colorOptions': threeColorOptions,
    'fontOptions': fontOptions,
    'textColorOptions': textColorOptions,
    'watermarkColorOptions': textColorOptions,
    'animationOptions': animationOptions,
    'textPositionOptions': textPositionOptions,
    'watermarkPositionOptions': watermarkPositionOptions
};


init(resources_data);