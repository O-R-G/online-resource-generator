export class Record {
    constructor(container, id='', canvasObjs=[]){
        this.container = container;
        this.id = id;
        this.canvasObjs = canvasObjs;
        this.record_body = '';
        this.form_action = this.id ? 'save' : 'insert';
        this.url = '/online-resource-generator/static/php/recordHandler.php';
        this.elements = {
            'form': null,
            'button': null
        }
        if (this.id)
            this.fetchRecord(this.id, () => {
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
        let temp_float_container = document.createElement('div');
        temp_float_container.className = 'float-container';

        this.elements.button = document.createElement('div');
        this.elements.button.className = 'record-form-button button-like-label half-right';
        this.elements.button.id = 'save-record-button';
        this.elements.button.innerText = 'Save';

        this.elements.share_button = document.createElement('div');
        this.elements.share_button.className = 'record-form-button button-like-label half-left';
        this.elements.share_button.id = 'fetch-record-button';
        this.elements.share_button.innerText = 'Share';
        
        // this.elements.form.appendChild(input_id);
        // this.elements.form.appendChild(this.elements.button);

        // this.elements.input_id = document.createElement('input');
        // this.elements.input_id.name = 'record_id';
        // this.elements.input_id.value = this.id;
        // let temp_label = document.createElement('label');
        // temp_label.innerText = 'Record ID';
        // let temp_div = document.createElement('div');
        // temp_div.className = 'half-right flex-container';
        // temp_div.appendChild(this.elements.input_id);

        // temp_div.appendChild(input_action);
        // temp_float_container.appendChild(temp_label);
        temp_float_container.appendChild(this.elements.share_button);
        temp_float_container.appendChild(this.elements.button);
        this.elements.form.append(input_action);
        this.elements.form.appendChild(temp_float_container);
        this.container.appendChild(this.elements.form);
    }
    addListeners(){
        this.elements.button.addEventListener('click', (event)=>{
            this.submit(event);
        })
        this.elements.share_button.addEventListener('click', (event)=>{
            if(!this.id) alert('You have to save the draft before you can share it.')
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
        //     if (!this.elements.input_id.value || this.elements.input_id.value == this.id) return;
        //     this.fetchRecord(this.elements.input_id.value, ()=>{
        //         window.location.href='?record=' + this.elements.input_id.value;
        //     });
        // })
    }
    fetchRecord(id='', callback=null){
        let data = new FormData();
        if (!id) id = this.id
        let data_json = {
            'action': 'get',
            'url': id
        }
        for(let prop in data_json)
            data.append(prop, data_json[prop]);
        fetch(this.url, {
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
        for(let shape_control_id in this.record_body) {
            for(let i = 0 ; i < this.record_body[shape_control_id]['watermarks_num']; i++) {
                for (let j = 0; j < this.canvasObjs.length; j++) {
                    for (let k = 0; k < this.canvasObjs[j].shapes.length; k++) {
                        this.canvasObjs[j].shapes[k].addWatermark();
                    }
                }
            }
            let fields = this.record_body[shape_control_id]['fields'];
            for (let field of fields) {
                let field_element = document.querySelector('#' + shape_control_id + ' #' + field['id']);
                field_element.value = field['value'];
                if (field_element.tagName.toLowerCase() == 'textarea') 
                    field_element.innerText = field['value'];
                field_element.dispatchEvent(new Event('change'));
            }
        }
    }
    submit(event){
        event.preventDefault();
        let data = new FormData(this.elements.form);
        // if(this.form_action == 'save') {
        let record_body = {};
        let record_name = 'new poster';
        let shape_controls = document.querySelectorAll('.shape-control');
        // let watermark_classes = ['watermark', 'watermark-position', 'watermark-color', 'watermark-fontsize', 'watermark-rotate', 'watermark-shift-x', 'watermark-shift-y'];
        for(let shape_control of shape_controls) {
            record_body[shape_control['id']] = {
                'id': shape_control['id'],
                'fields': [],
                'watermarks_num': document.querySelectorAll('.watermark').length
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
    // }
        fetch(this.url, {
            method: 'POST',
            body: data
        }).then((response) => response.json()
        ).then((json) => {
            if(json['status'] == 'success') {
                if (this.form_action == 'insert')
                    window.location.href = json['body'];
                else if(this.form_action == 'save')
                    console.log(json['body']);
            }
        })
    }
}
