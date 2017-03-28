import * as THREE from "three";
import { OrbitControls } from "OrbitControls";

class CameraController {
	constructor(renderer, scene, options) {
		debugger;
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 1000);
		this.renderer = renderer;
		this.scene = scene;
		this.options = Object.assign(CameraController.defaultOptions, options);

		this.cameraControls = new OrbitControls(this.camera, this.renderer.domElement, this.scene);
		this.setOptions(this.options);

	}

	static get defaultOptions() {
		return {
			userPanSpeed: 1.0
		};
	}

	setOptions(options) {
		this.cameraControls.userPanSpeed = options.userPanSpeed;
	}

	positionCamera(cameraPos) {
		let cameraObj = this.cameraControls.cameraObject;
		cameraObj.position.x = cameraPos[0];
		cameraObj.position.y = cameraPos[1];
		cameraObj.position.z = cameraPos[2];

		this.update();
	}

	lookAt(targetPos) {
		this.cameraControls.center = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
		this.update();
	}

	update() {
		this.cameraControls.update();
	}
}

export { CameraController };