export class Record {
    constructor(container, record_url='', canvasObjs=[]){
        this.container = container;
        this.record_url = record_url;
        this.canvasObjs = canvasObjs;
        this.record_body = '';
        this.form_action = this.record_url ? 'save' : 'insert';
        this.request_url = '/online-resource-generator/static/php/recordHandler.php';
        this.elements = {
            'form': null,
            'button': null
        }
        if (this.record_url)
            this.fetchRecord(this.record_url, () => {
                setTimeout(()=>this.applySavedRecord(), 0);
            });
        this.renderElements();
        this.addListeners();
    }
    renderElements(){
        this.elements.form = document.createElement('form');
        this.elements.form.method = 'post';
        this.elements.form.id = 'record-form';
        // this.elements.form.className = 'panel-section';
        let input_action = document.createElement('input');
        input_action.type = 'hidden';
        input_action.name = 'action';
        input_action.value = this.form_action;
        let temp_flex_container = document.createElement('div');
        temp_flex_container.className = 'flex-container';

        this.elements.save_button = document.createElement('div');
        this.elements.save_button.className = 'record-form-button button-like-label flex-item';
        this.elements.save_button.setAttribute('flex', 'half');
        this.elements.save_button.id = 'save-record-button';
        this.elements.save_button.innerHTML = 'Save <img class="inline-icon" src="/online-resource-generator/media/svg/save-3-w.svg">';

        this.elements.share_button = document.createElement('div');
        this.elements.share_button.className = 'record-form-button button-like-label flex-item';
        this.elements.share_button.setAttribute('flex', 'half');
        this.elements.share_button.id = 'fetch-record-button';
        this.elements.share_button.innerHTML = 'Share <img class="inline-icon" src="/online-resource-generator/media/svg/share-3-w.svg">';
        
        temp_flex_container.appendChild(this.elements.save_button);
        temp_flex_container.appendChild(this.elements.share_button);
        this.elements.form.append(input_action);
        this.elements.form.appendChild(temp_flex_container);
        this.container.appendChild(this.elements.form);
    }
    addListeners(){
        this.elements.save_button.addEventListener('click', (event)=>{
            this.submit(event, ()=>{
                alert('Saved!');
            });
        })
        this.elements.share_button.addEventListener('click', (event)=>{
            if(!this.record_url) alert('You have to save the draft before you can share it.')
            else {

                let url = location.href;
                if(!navigator.clipboard) {
                    alert('There is some error when trying to copy the URL to your clipboard...');
                    return;
                }
                navigator.clipboard.writeText(url).then(function() {
                    alert('URL is copied to your clipboard!');
                }).catch(function(err) {
                    
                    let textArea = document.createElement("textarea");
                    textArea.value = url;

                    // Avoid scrolling to bottom
                    textArea.style.top = "0";
                    textArea.style.left = "0";
                    textArea.style.position = "fixed";

                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();

                    try {
                        var successful = document.execCommand('copy');
                        if (successful) {
                            alert('URL is copied to your clipboard!');
                        }
                        else {
                            console.error('copy clipboard fallback error...');
                        }
                        // var msg = successful ? 'successful' : 'unsuccessful';
                        // console.log('Fallback: Copying text command was ' + msg);
                        
                    } catch (err) {
                        alert('There is some error when trying to copy the URL to your clipboard...');
                        // console.error('Fallback: Oops, unable to copy', err);
                    }
                    document.body.removeChild(textArea);
                });
            }
        })
        // this.elements.fetch_button.addEventListener('click', (event) =>{
        //     event.preventDefault();
        //     if (!this.elements.input_id.value || this.elements.input_id.value == this.record_url) return;
        //     this.fetchRecord(this.elements.input_id.value, ()=>{
        //         window.location.href='?record=' + this.elements.input_id.value;
        //     });
        // })
    }
    fetchRecord(record_url='', callback=null){
        let data = new FormData();
        if (!record_url) record_url = this.record_url
        let data_json = {
            'action': 'get',
            'record_url': record_url
        }
        for(let prop in data_json)
            data.append(prop, data_json[prop]);
        fetch(this.request_url, {
            method: 'POST',
            body: data
        }).then((response) => response.json()
        ).then((json) => {
            if(json['status'] == 'success') {
                this.record_body = JSON.parse(json['body']);
                if (typeof callback == 'function') {
                    callback();
                }
            } else {
                alert('Fail to find any record with id: ' + id);
            }
        })
    }
    applySavedRecord(){
        let static_fields = [], animated_fields = [];
        let active_canvas = 'static';
        
        for(let shape_control_id in this.record_body) {
            let shape_control = document.getElementById(shape_control_id);
            if (!shape_control) continue;
            let isThree = shape_control.classList.contains('animated-shape-control');
            for(let i = 0 ; i < this.record_body[shape_control_id]['watermarks_num']; i++) {
                for (let j = 0; j < this.canvasObjs.length; j++) {
                    for (let k = 0; k < this.canvasObjs[j].shapes.length; k++) {
                        this.canvasObjs[j].shapes[k].addWatermark();
                    }
                }
            }
            let fields = this.record_body[shape_control_id]['fields'];
            for (let field of fields) {
                if(!field['id']) {
                    continue;
                }
                let field_element = shape_control.querySelector('#' + field['id']);
                if(!field_element) continue;
        
                field_element.value = field['value'];

                if (field_element.classList.contains('field-id-animation')) 
                    active_canvas = field['value'] == 'none' ? 'static' : 'animated'; 
                
                if (field_element.tagName.toLowerCase() == 'textarea') 
                    field_element.innerText = field['value'];
                if (isThree) animated_fields.push(field_element);
                else static_fields.push(field_element);
            }
        }
        console.log(active_canvas)
        if (active_canvas == 'static') 
            for(let field_element of static_fields) 
                field_element.dispatchEvent(new Event('change'));
        else
            for(let field_element of animated_fields) 
                field_element.dispatchEvent(new Event('change'));
    }
    submit(event, cb){
        event.preventDefault();
        let data = new FormData(this.elements.form);
        // if(this.form_action == 'save') {
        let record_body = {};
        let record_name = 'new poster';
        let shape_controls = document.querySelectorAll('.shape-control');
        console.log(shape_controls)
        // let watermark_classes = ['watermark', 'watermark-position', 'watermark-color', 'watermark-fontsize', 'watermark-rotate', 'watermark-shift-x', 'watermark-shift-y'];
        for(let shape_control of shape_controls) {
            let watermarks = shape_control.querySelectorAll('.watermark');
            let watermarks_num = 0;
            for (let watermark of watermarks) {
                if (!watermark.value) continue;
                watermarks_num++;
            }
            record_body[shape_control['id']] = {
                'id': shape_control['id'],
                'fields': [],
                'watermarks_num': watermarks_num
            }
            let fields = shape_control.querySelectorAll('select, input, textarea');
            for(let field of fields) {
                if(!field.value) continue;
                let this_field = {
                    'id': field.id,
                    'value': field.value
                }
                record_body[shape_control['id']]['fields'].push(this_field);
                if (field.classList.contains('field-id-text'))
                    record_name = field.value;
            }
        }
        record_body = JSON.stringify(record_body);
        data.append('record_body', record_body);
        data.append('record_name', record_name);
        data.append('record_url', this.record_url);
    // }
        fetch(this.request_url, {
            method: 'POST',
            body: data
        }).then((response) => response.json()
        ).then((json) => {
            if(json['status'] == 'success') {
                if (this.form_action == 'insert') {
                    // alert('Saved!');
                    window.location.href = json['body'];
                }
                else if(this.form_action == 'save')
                    console.log(json['body']);
            }
        }).then((json)=>{
            if (typeof cb === 'function')
                cb(json);
        })
    }
}
