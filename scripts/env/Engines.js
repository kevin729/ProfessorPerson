var ParticleEngine = function(speed, gravity, lifeTime, RandX, RandY, RandZ, Texture) {
	var particles = [];

	var randX = RandX;
	var randY = RandY;
	var randZ = RandZ;

	var texture = Texture;

	this.tick = function() {
		for (var i = 0; i < particles.length; i++) {
			var p = particles[i];
			p.tick();

			if (!p.alive) {
				particles.splice(particles.indexOf(p), 1);
			}
		}
	}

	this.process = function(shader) {
		for (var i = 0; i < particles.length; i++) {
			shader.processParticle(particles[i]);
		}
	}

	this.addParticles = function(position) {
		var randomX = (Math.random()*(randX[0]-randX[1])+randX[1]) * speed;
		var randomY = (Math.random()*(randY[0]-randY[1])+randY[1]) * speed;
		var randomZ = (Math.random()*(randZ[0]-randZ[1])+randZ[1]) * speed;

		particles.push(new Particle(position, [randomX, randomY, randomZ], lifeTime, gravity, 0, 3, texture));
	}
}

var SkyBoxEngine = function() {
	var time = 0;
	var blendFactor = 0;
	var rotation = 0;
	var rotSpeed = 3;


	this.tick = function() {
		time += 500*delta;
		time %= 24000;


		if(time >= 6000 && time <= 18000) {
			blendFactor -= 0.3 * delta;
			blendFactor = Math.max(blendFactor, 0);
		} else {
			blendFactor += 0.3 * delta;
			blendFactor = Math.min(blendFactor, 1);
		}

		rotation += rotSpeed * delta;
	}

	this.getBlendFactor = function() {
		return blendFactor;
	}

	this.getRotation = function() {
		return rotation;
	}
}

var RayTracerEngine = function(camera) {
	this.currentRay = [];
	
	this.viewMatrix;
	this.camera = camera;

	this.calculateRay = function() {
		var normalizedCoords = this.getNormalizedCoords();
		var clipCoords = [normalizedCoords[0], normalizedCoords[1], -1, 1];
		var eyeCoords = this.toEyeCoords(clipCoords);
		var ray = this.toWorldCoords(eyeCoords);
		ray = [-ray[0], -ray[1], -ray[2]];
		return ray;
	}

	this.getNormalizedCoords = function() {
		return [((2*mouseX)/canvas.width) - 1, -(((2*mouseY)/canvas.height) - 1)];
	}

	this.toEyeCoords = function(clipCoords) {
		var invertedProjMatrix = projMatrix;
		mat4.invert(invertedProjMatrix, invertedProjMatrix);
		var eyeCoords = [];
		vec3.transformMat4(eyeCoords, clipCoords, invertedProjMatrix);
		return [eyeCoords[0], eyeCoords[1], -1, 0];
	}

	this.toWorldCoords = function(eyeCoords) {
		var invertedViewMatrix = this.viewMatrix;
		mat4.invert(invertedViewMatrix, invertedViewMatrix);
		var worldRay = []
		vec3.transformMat4(worldRay, eyeCoords, invertedViewMatrix);

		var ray = [worldRay[0], worldRay[1], worldRay[2]];

		return vec3.normalize(ray, ray);
	}

	this.update = function() {
		this.viewMatrix = createViewMatrix(this.camera);
		this.currentRay = this.calculateRay();

		console.log(this.currentRay);
	}
}