import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const r = new THREE.WebGLRenderer({ antialias: true }); r.setSize(1200, 500); r.outputColorSpace = THREE.SRGBColorSpace; document.body.appendChild(r.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color('#9fb0b8');
sc.add(new THREE.HemisphereLight(0xeef0ea, 0x5d5446, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(-3, 6, 5); sc.add(d);
const cam = new THREE.PerspectiveCamera(35, 1200 / 500, 0.1, 100); cam.position.set(0, 3, 13); cam.lookAt(0, 1.5, 0);
const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshLambertMaterial({ color: '#555' })); g.rotation.x = -Math.PI / 2; sc.add(g);
const nama = window.NAMA; let n = 0;
nama.forEach((f, i) => new GLTFLoader().load(f + '.glb', (gl) => { gl.scene.position.x = (i - (nama.length - 1) / 2) * 2.6; sc.add(gl.scene); if (++n === nama.length) { r.render(sc, cam); window.SIAP = true; } }, undefined, (e) => { console.log('ERR', f, e.message); }));
