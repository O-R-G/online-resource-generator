import {getDefaultOption} from './lib.js'
export function renderSection(id='', displayName, children=[], extraClass=''){
    let output = document.createElement('div');
    output.className = 'panel-section float-container ' + extraClass;
    if(id) output.id = id;
    let label = document.createElement('label');
    label.innerText = displayName;
    let right = document.createElement('div');
    right.className = 'half-right flex-container';
    if(typeof children === 'object') {
        if(Array.isArray(children)) {
            for(let i = 0; i < children.length; i++) 
                right.appendChild(children[i]);
                
        }else {
            right.appendChild(children);
        }
    }
    output.appendChild(label);
    output.appendChild(right);
    return output;
}
export function renderSelect(id, options, extraClass='', attrs=null, selected_value=null){
    if(!options) return null;
    let output = document.createElement('select');
    output.className = 'field-select' + ' ' + extraClass;
    output.id = id;
    const default_key = getDefaultOption(options, true);

    
    let default_idx = 0;
    if(typeof options === 'object' && options !== null)
    {
        let idx = 0;
        for (const [key, value] of Object.entries(options)) {
            let opt = document.createElement('option');
            opt.value = key;
            opt.innerText = value['name'];
            if(key === selected_value)  {
                opt.selected=true;
                output.selectedIndex = idx; 
            }
            if(key === default_key) {
                default_idx = idx;
            }
            output.appendChild(opt);
            idx++;
        }
        if(!output.selectedIndex) output.selectedIndex = default_idx;
    }
    if(attrs) {
        for(let attr in attrs) {
            output.setAttribute(attr, attrs[attr]);
        }
    }

    return output;
}
export function renderInput(id, value='', attrs = null, extraClass = ''){
    let output = document.createElement('input');
    output.id = id;
    if(value !== null) output.value = value;
    output.autocomplete = "off";
    if(attrs) {
        for(let attr in attrs) {
            output.setAttribute(attr, attrs[attr]);
        }
    }
    if(extraClass) output.className = extraClass;
    return output;
}
export function renderNumeralField(id, displayName, begin, step, min=false, extraClass='', extraWrapperClass='')
{
    let section = document.createElement('div');
    section.className  = "float-container " + extraWrapperClass;
    let label = document.createElement('LABEL');
    label.setAttribute('for', id);
    label.innerText = displayName;
    let input = renderNumeralInput(id, begin, step, min, extraClass);
    let right = document.createElement('div');
    right.className = 'half-right flex-container';
    right.appendChild(input);
    section.appendChild(label);
    section.appendChild(right);
    
    return [section, input];
}
export function renderNumeralInput(id, begin, step, min=false, extraClass='', attrs=null){
    let output = document.createElement('INPUT');
    output.className = 'number-element flex-item ' + extraClass;
    output.type = 'number';
    output.value = begin;
    output.setAttribute('step', step);
    output.setAttribute('min', min);
    if(attrs) {
        for(let attr in attrs) {
            output.setAttribute(attr, attrs[attr]);
        }
    }
    output.id = id;
    return output;
}
export function renderCustomControls(items=[]){
    for (let item of items) {
        if(item['input-type'] === 'select') {
            let cls = `field-id-${item['id']} flex-item typography-flex-item`; 
            if(item['class']) cls += item['class'];
            /* the formats of font and typography are saved differently so add exceptions here */
            const value = (item.name === 'font' || item.name === 'typography') ? Object.keys(item['options']).find((itm)=>{ return item['options'][itm] === item['value']; }) : item['value'];
            item['el'] = renderSelect(item['id'], item['options'], cls, item['attr'], value);
        } else if(item['input-type'] === 'text') {
            let cls = `field-id-${item['id']} flex-item`; 
            if(item['class']) cls += item['class'];
            // let cls = item['class'] ? 'flex-item ' + item['class'] :  'flex-item';
            item['el'] = renderInput(item['id'], item['value'], item['attr'], cls);
        } else if(item['input-type'] === 'number') {
            let cls = `field-id-${item['id']} flex-item`; 
            if(item['class']) cls += item['class'];
            item['el'] = renderNumeralInput(item['id'], 1.0, 0.1, false, cls, item['attr']);
        }
        if(!item['el']) continue;
        // container.appendChild(item['el']);
        // this.fields[item['id']] = item['el'];
    }
    // if(typeof cb === 'function') {
    //     cb(items);
    // }
    return items;
}
export function renderImageControls(id=''){
    console.log('renderImageControls')
    let container = document.createElement('div');
    container.className = 'field-id-image-controls float-container flex-item';
    container.id = id ? id + '-field-id-image-controls' : '';
    container.setAttribute('flex', 'full');

    let [section_scale] = renderNumeralField(id + '-scale', 'Scale', 1.0, 0.1, false, 'img-control-scale', '');
    let [section_x] = renderNumeralField(id + '-shift-x', 'X', 0, 1, false, 'img-control-shift-x', '');
    let [section_y] = renderNumeralField(id + '-shift-y', 'Y', 0, 1, false, 'img-control-shift-y', '');
    console.log(section_scale);
    container.append(section_scale);
    container.append(section_x);
    container.append(section_y);
    return container;
}