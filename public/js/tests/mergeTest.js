import * as THREE from "three";

import { SceneRenderer } from "../SceneRenderer";

console.log('THREE.REVISION: ', THREE.REVISION);
THREE.Cache.enabled = true;

class MergeTest {
	constructor(global) {
		this.sceneRenderer = new SceneRenderer();
		this.sceneRenderer.animate();
		this.scene = this.sceneRenderer.scene;

		global.scene = this.scene;


	}

	buildMaterial() {
		return new THREE.MultiMaterial([
			new THREE.MeshBasicMaterial({color: 0xff0000}),
			new THREE.MeshBasicMaterial({color: 0x00ff00}),
			new THREE.MeshBasicMaterial({color: 0x0000ff}),
			new THREE.MeshBasicMaterial({color: 0xffff00}),
			new THREE.MeshBasicMaterial({color: 0xff00ff}),
			new THREE.MeshBasicMaterial({color: 0x00ffff})
		]);
	}

	buildCubes() {
		let i, j, k;
		this.block0 = new THREE.BoxGeometry(0.8, 0.8, 0.8);
		this.block0.translate(-1, 0, -1);

		let material = this.buildMaterial();
		let mesh0 = new THREE.Mesh(this.block0, material);

		this.scene.add(mesh0);

		for (i = 0; i < 3; i++) {
			for (j = 0; j < 3; j++) {
				for (k = 0; k < 3; k++) {
					this.addCube(i, j, k);
				}
			}
		}
	}

	addCube(x, y, z) {
		setTimeout(() => {
			debugger;
			let block = new THREE.BoxGeometry(0.8, 0.8, 0.8);
			block.translate(x, y, z);
			this.block0.merge(block);

			this.block0.elementsNeedUpdate = true;
			this.block0.verticesNeedUpdate = true;
			this.block0.uvsNeedUpdate = true;
			this.block0.normalsNeedUpdate = true;
			this.block0.colorsNeedUpdate = true;
			this.block0.lineDistancesNeedUpdate = true;
			this.block0.groupsNeedUpdate = true;
		}, 50);
	}
}

let test = new MergeTest(window);
test.buildCubes();
