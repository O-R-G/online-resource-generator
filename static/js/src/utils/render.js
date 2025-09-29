import {getDefaultOption, getClassString, addExtraAttr} from './lib.js'

export function renderSection(id='', displayName='', children=[], extraClass=[], extraAttr=null){
    let output = document.createElement('div');
    output.className = getClassString(['panel-section', 'float-container'].concat(extraClass));
    if(extraAttr) addExtraAttr(output, attr);
    if(id) output.id = id;

    let right = document.createElement('div');
    right.className = 'half-right flex-container';
    if(typeof children === 'object') {
        if(Array.isArray(children)) {
            for(let i = 0; i < children.length; i++) 
                right.appendChild(children[i]);
                
        } else {
            right.appendChild(children);
        }
    }
    if(displayName) {
        let label = document.createElement('label');
        label.innerText = displayName;
        label.className = 'display-name';
        output.appendChild(label);
    }
    output.appendChild(right);
    return [output, right];
}
export function renderSelectSection(id, displayName, selectData, extraFieldClass=[], extraSectionClass=[], extraFieldAttr = null, extraSectionAttr=null)
{
    let select = renderSelect(id, selectData, ['flex-item'].concat(extraFieldClass), extraFieldAttr);
    let [section] = renderSection('', displayName, select, extraSectionClass, extraSectionAttr);
    return [section, select];
}
export function renderInput(id, value='', attrs = null, extraClass = []){
    let output = document.createElement('input');
    output.id = id;
    if(value !== null) output.value = value;
    output.autocomplete = "off";
    
    if(attrs) addExtraAttr(output, attrs);
    output.className = getClassString([...extraClass, 'input-element']);
    return output;
}
export function renderSelect(id, data, extraClass=[], attrs=null, placeholder=''){
    const options = data && data.options ? data.options : null;
    if(!options) return null;
    const selected_value = data && data.selected_value ? data.selected_value : null;
    const output = document.createElement('select');
    const cls = ['select-element'].concat(extraClass);
    if(placeholder) cls.push('showing-placeholder');
    output.className = getClassString(cls);
    output.id = id;
    const default_key = getDefaultOption(options, true);
    let default_idx = 0;
    if(typeof options === 'object' && options !== null)
    {
        if(placeholder) {
            let opt = document.createElement('option');
            opt.value = '';
            opt.innerText = placeholder;
            opt.disabled = true;
            opt.selected = true;
            output.appendChild(opt);
        }
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
export function renderSelectField(id, displayName, options, extraClass=[])
{
    let section = document.createElement('div');
    section.className  = getClassString(["panel-section", "float-container"].concat(extraClass));
    let label = document.createElement('LABEL');
    label.setAttribute('for', id);
    label.innerText = displayName;
    label.className = 'display-name';
    let right = document.createElement('div');
    right.className = 'half-right flex-container';
    let select = renderSelect(id, options, ['flex-item']);
    right.appendChild(select);
    section.appendChild(label);
    section.appendChild(right);
    // this.fields[id] = temp_select;
    return [section, select];
}

export function renderNumeralSection(id, displayName, begin, step, min=false, extraClass=[], extraSectionClass=[], extraFieldAttr = null, extraSectionAttr=null)
{
    let input = renderNumeralInput(id, begin, step, min, extraClass, extraFieldAttr);
    let [section] = renderSection('', displayName, input, extraSectionClass, extraSectionAttr);
    return [section, input];
}
export function renderNumeralInput(id, begin=0, step=1, min=false, extraClass=[], attrs=null){
    let output = document.createElement('INPUT');
    output.className = getClassString(['input-element', 'number-element'].concat(extraClass));
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
        console.log();
        let cls = [`field-id-${item['id']}`, 'flex-item'];
        if(item['class']) {
            if(Array.isArray(item['class']))
                cls = cls.concat(item['class']);  
            else if (typeof item['class'] === 'string')
                cls.push(item['class']);
        }
        if(item['input-type'] === 'select') {
            /* the formats of font and typography are saved differently so add exceptions here */
            const value = (item.name === 'font' || item.name === 'typography') ? Object.keys(item['options']).find((itm)=>{ return item['options'][itm] === item['value']; }) : item['value'];
            item['el'] = renderSelect(item['id'], {options: item['options']}, cls, item['attr'], value);
        } else if(item['input-type'] === 'text') {
            item['el'] = renderInput(item['id'], item['value'], item['attr'], cls);
        } else if(item['input-type'] === 'number') {
            item['el'] = renderNumeralInput(item['id'], 1.0, 0.1, false, cls, item['attr']);
        }
        if(!item['el']) continue;
    }
    return items;
}
export function renderImageControls(id='', control_data=[]){
    let container = document.createElement('div');
    container.className = 'field-id-image-controls float-container flex-item';
    container.id = id ? id + '-field-id-image-controls' : '';
    container.setAttribute('flex', 'full');
    for(const control of control_data) {
        if(control['input-type'] === 'number') {
            let [section, input] = renderNumeralSection(control['id'], control['displayName'], control.meta.begin, control.meta.step, false, control['class'], ['media-control-section']);
            if(control.value) input.value = control.value;
            container.append(section);
        }else if(control['input-type'] === 'select') {
            let [section, input] = renderSelectSection(control['id'], control['displayName'], { options: control.meta.options}, control['class'], ['media-control-section']);
            if(control.value) input.value = control.value;
            container.append(section);
        }
        
    }
    return container;
}
export function renderFileField(id, key, src, extraClass={'wrapper': [], 'input': []}, extraAttr={'wrapper': null, 'input': null}){
        // let id = this.id + '-field-id-' + key;
        let output = document.createElement('div');
        let input = document.createElement('input');
        let label = document.createElement('label');
        let extraWrapperClass = extraClass['wrapper'] && extraClass['wrapper'].length ? ' ' + getClassString(extraClass['wrapper']) : '';
        output.className = 'field-wrapper ' + id + '-wrapper' + extraWrapperClass;
        if(extraAttr['wrapper']) output = addExtraAttr(output, extraAttr['wrapper']);
        
        let extraInputClass = extraClass['input'] && extraClass['input'].length ? ' ' + getClassString(extraClass['input']) : '';
        input.className = 'field-id-' + key + extraInputClass;
        input.id = id;
        input.type = 'file';
		input.setAttribute('image-idx', key);
        // if(this.media[key]?.src) input.setAttribute('data-file-src', this.media[key].src);
        input.setAttribute('data-file-src', src);
        label.setAttribute('for', id);
        
		label.className = 'pseudo-upload';
        label.innerText = 'Choose file';
        output.appendChild(input);
        output.appendChild(label);
        // this.fields.media[key] = input
        return [output, input];
    }