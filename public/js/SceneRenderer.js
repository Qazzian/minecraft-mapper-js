import * as THREE from "three";

import { CameraController } from "../CameraController";

class SceneRenderer {
	constructor() {
		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.cameraControls = new CameraController(this.renderer, this.scene);

		this.addAxisLines([0, 0, 0]);

		this.cameraControls.positionCamera([10, 10, 10]);
		this.cameraControls.lookAt([0, 0, 0]);
	}

	addAxisLines(pos) {
		let axisHelper = new THREE.AxisHelper(10);
		axisHelper.translateX(pos[0]);
		axisHelper.translateY(pos[1]);
		axisHelper.translateZ(pos[2]);
		this.scene.add(axisHelper);
	}

	render() {
		this.cameraControls.update();
		this.renderer.render(this.scene, this.cameraControls.camera);
	};

	animate() {
		requestAnimationFrame(() => {
			this.animate()
		});
		this.render();
	}
}

export { SceneRenderer }