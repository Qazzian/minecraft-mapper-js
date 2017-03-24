import * as THREE from "three";

import { SceneRenderer } from "../SceneRenderer";

console.log('THREE.REVISION: ', THREE.REVISION);
THREE.Cache.enabled = true;

class MergeTest {
	constructor() {
		this.scene = new SceneRenderer();
		this.scene.animate();
	}
}

let test = new MergeTest();
