import * as THREE from "three";
import MediaAnimated from "./../MediaAnimated.js";

export function createMesh(name=''){
    const output = new THREE.Mesh();
    if(name) output.name = name;
    output.initialized = false;
    return output;
}
export function createGroup(name=''){
    const output = new THREE.Group();
    if(name) output.name = name;
    return output;
}
export function processStaticColorData(colorData){
    let output = {}; // params of material
    let color = '';
    if(colorData['code'].length == 4 && colorData['code'].indexOf('#') !== -1)
    {
        for(let i = 1; i <= 3; i++)
            color += colorData['code'][i] + colorData['code'][i];
        color = '#' + color;
    }
    else
        color = colorData['code'];
    output['color'] = new THREE.Color(color);
    if(colorData.type == 'transparent')
    {
        output['transparent'] = true;
        output['opacity'] = colorData.opacity;

    }
    return output;
}
export function generateGradient(geometry, colors, angle){
    angle = typeof angle === undefined ? 90 : angle;
    geometry.computeBoundingBox();
    let uniforms = {};

    colors.forEach(function(el, i){
        uniforms['color' + (i + 1)] = {};
        uniforms['color' + (i + 1)].value = new THREE.Color(el);
    });

    uniforms.bboxMin = {};
    uniforms.bboxMin.value = geometry.boundingBox.min;
    uniforms.bboxMax = {};
    uniforms.bboxMax.value = geometry.boundingBox.max;

    if(colors.length == 2)
        return generateTwoColorsGradient(uniforms, angle);
    else if(colors.length == 3)
        return generateThreeColorsGradient(uniforms, angle);
}
export function generateGridPattern(colors, size){
    let m = [];
    // let num = (this.canvas.width) / size;
    let num = 8;
    let g = new THREE.PlaneGeometry( 540, 540, 8, 8 );
    m.push(new THREE.MeshBasicMaterial({color: 'rgb(0,0,255)'}));
    m.push(new THREE.MeshBasicMaterial({color: 'rgb(255,0,0)'}));
    for(let i = 0; i < num; i++ ) {
        for(let j = 0; j < num; j++){
            let mIdx = i % 2 == 0 ? (j % 2 == 0 ? m[0] : m[1]) : (j % 2 == 0 ? m[1] : m[0]);
            g.addGroup(i, 1, mIdx)
        }
    }
    let output = new THREE.Mesh( g, m);
    return output;
}
export function generateThreeColorsGradient(uniforms, angle){
    uniforms.measure = Math.abs(uniforms.bboxMax.value.x * 2);
    let material_gradient = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
        uniform vec3 bboxMin;
        uniform vec3 bboxMax;

        varying vec2 vUv;

        void main() {
            vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y) * .5;
            vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x) * .5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float measure;

        varying vec2 vUv;

        void main() {
            if( vUv.x + vUv.y < .5 )
            {
                gl_FragColor = vec4(mix(color1, color2, (vUv.x+vUv.y) * 2. ), 1.0);
            }
            else
                gl_FragColor = vec4(mix(color3, color2, (1. - (vUv.x+vUv.y)) * 2. ), 1.0);
            
        }
    `
    });
    return material_gradient;
}
export function generateTwoColorsGradient(uniforms, angle){
    if(angle == 45)
    {
        var vertexShader = `
            uniform vec3 bboxMin;
            uniform vec3 bboxMax;

            varying vec2 vUv;

            void main() {
                vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y) / 2. ;
                vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x) / 2. ;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `;
        var fragmentShader = `
            uniform vec3 color1;
            uniform vec3 color2;

            varying vec2 vUv;

            void main() {
                gl_FragColor = vec4(mix(color1, color2, vUv.x+vUv.y), 1.0);
            }
        `;
    }
    else if(angle == 90)
    {
        var vertexShader = `
            uniform vec3 bboxMin;
            uniform vec3 bboxMax;

            varying vec2 vUv;

            void main() {
                vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y) ;
                vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x) ;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
        `;
        var fragmentShader = `
            uniform vec3 color1;
            uniform vec3 color2;

            varying vec2 vUv;

            void main() {
                gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
            }
        `;
    }
    let material_gradient = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
    return material_gradient;
}
export function initMediaAnimated(key, prefix, canvas, onUpdate, onUpload, options, props){
    if(!props['mesh']) {
        let mesh = {
            front: createMesh(key),
            back: createMesh(key)
        };
        props['mesh'] = mesh;
    }
    return new MediaAnimated(key, prefix, canvas, onUpdate, onUpload, options, props);
}