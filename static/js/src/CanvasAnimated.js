import * as THREE from "three";
import Canvas from "./Canvas.js";

export default class CanvasAnimated extends Canvas {
    constructor(wrapper, format, prefix, options, isThree = false){
        super(wrapper, format, prefix, options, isThree);
        this.isThree = true;
        this.scale = 1;
	}
    applyImageAsMaterial(idx, mesh, silent){
        const textureLoader = new THREE.TextureLoader();
        return new Promise((resolve, reject) => {
            textureLoader.load(this.media[idx].obj.src, (texture) => {
                // Set texture filtering
                texture.magFilter = THREE.LinearFilter;
                texture.minFilter = THREE.LinearFilter;
                texture.colorSpace = THREE.SRGBColorSpace;
                let material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
                mesh.material = material;
                mesh.needsUpdate = true;
                let geometry = mesh.geometry;

                const imageAspect = texture.image.width / texture.image.height;
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                const geomWidth = bbox.max.x - bbox.min.x;
                const geomHeight = bbox.max.y - bbox.min.y;
                const geometryAspect = geomWidth / geomHeight;

                let scaleX = 1 / this.media[idx].scale;
                let scaleY = 1 / this.media[idx].scale;

                if (imageAspect > geometryAspect) {
                    scaleX *= geometryAspect / imageAspect;
                } else {
                    scaleY *= imageAspect / geometryAspect;
                }

                const dev_x = this.media[idx].shiftX ? this.getValueByPixelRatio(this.media[idx].shiftX) * scaleX / geomWidth : 0;
                const dev_y = this.media[idx].shiftY ? - this.getValueByPixelRatio(this.media[idx].shiftY) * scaleY / geomHeight : 0;
                
                const uvArray = [];
                const position = geometry.attributes.position;
                const max = bbox.max;
                const min = bbox.min;

                for (let i = 0; i < position.count; i++) {
                    const x = position.getX(i);
                    const y = position.getY(i);
            
                    let u = (x - min.x) / (max.x - min.x);
                    let v = (y - min.y) / (max.y - min.y);
                    u = u * scaleX + (1 - scaleX) / 2 - dev_x;
                    v = v * scaleY + (1 - scaleY) / 2 + dev_y;

                    // if (u < 0 || u > 1 || v < 0 || v > 1) {
                    // 	u = Math.max(Math.min(u, 1), 0);
                    // 	v = Math.max(Math.min(v, 1), 0);
                    // }
                    uvArray.push(u, v);
                }

                geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2));
                geometry.attributes.uv.needsUpdate = true;
                
                if(!silent) this.draw();
                resolve(material);
            });
        })
    }
}
