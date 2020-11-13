var WaterTileSize = 64;

function toRadians(degrees)
{
	return degrees*(Math.PI/180);
}

function toDegrees(degrees)
{
	return degrees*(180/Math.PI);
}

function createViewMatrix(camera) {
	var viewMatrix = new Float32Array(16);
	mat4.identity(viewMatrix);
		
	mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.pitch), [1,0,0]);
	mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.yaw), [0,1,0]);
	mat4.rotate(viewMatrix, viewMatrix, toRadians(camera.roll), [0,0,1]);
		
	mat4.translate(viewMatrix, viewMatrix, [-camera.x, -camera.y, -camera.z]);

	return viewMatrix;
}

function getModel(modelName) {
	var model;
	models.forEach(function(m) {
		if (m[0] == modelName) {
			model = m[2];
			return;
		}
	})

	return model;
}

function getTexture(textureName) {
	var tex;
	textureImages.forEach(function(texture){
		if(texture[0] == textureName) {
			tex = texture[7];
			return;
		}
	})
	
	return tex;
}

function getSkyBoxTextures(skyBoxName) {
	var textures;
	textureImages.forEach(function(skyBox){
		if(skyBox[0] == skyBoxName) {
			textures = skyBox[3];
			return;
		}
	})

	return textures;
}

function getImage(textureName) {
	var tex;
	textureImages.forEach(function(texture){
		if(texture[0] == textureName) {
			tex = texture[8];
			return;
		}
	})
	
	return tex;
}

var HashMap = function() {
	this.arr = []
	
	this.put = function(key, value) {
		this.arr.push([key, value]);
	}
	
	this.get = function(key) {
		
		var list;
		this.arr.forEach(function(a) {
			if(a[0] == key) {
				list = a;
			}
		});
		
		return list;
	}
	
	this.getValue = function(key) {
		var value;
		this.arr.forEach(function(a) {
			if(a[0] == key) {
				value = a[1];
			}
		});
		
		return value;
	}

	this.clear = function() {
		this.arr = [];
	}
	
	this.SKYBOXSIZE = function() {
		return this.arr.length;
	}
	
	this.getArray = function() {
		return this.arr;
	}
}

function unbind()
{
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

var SKYBOXSIZE = 1000;

var skyBoxVertices = [
		-SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,
	    -SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,
	    -SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,

	    -SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,
	    -SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	    -SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,
	    -SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,
	    -SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	    -SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,

	     SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,

	    -SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,
	    -SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,
	    -SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,

	    -SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	    -SKYBOXSIZE,  SKYBOXSIZE,  SKYBOXSIZE,
	    -SKYBOXSIZE,  SKYBOXSIZE, -SKYBOXSIZE,

	    -SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	    -SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE, -SKYBOXSIZE,
	    -SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE,
	     SKYBOXSIZE, -SKYBOXSIZE,  SKYBOXSIZE
];

function barryCentric(p1, p2, p3, pos) {
	var det = (p2[2]-p3[2]) * (p1[0]-p3[0]) + (p3[0]-p2[0]) * (p1[2]-p3[2]);
	var l1 = ((p2[2]-p3[2]) * (pos[0]-p3[0]) + (p3[0]-p2[0]) * (pos[1]-p3[2])) / det;
	var l2 = ((p3[2]-p1[2]) * (pos[0]-p3[0]) + (p1[0]-p3[0]) * (pos[1]-p3[2])) / det;
	var l3 = 1 - l1 - l2;
	
	return l1 * p1[1] + l2 * p2[1] + l3 * p3[1];
}

function rotateVector(a, r) {
	var c = a;

	var cosX = Math.cos(toRadians(r[0]));
	var sinX = Math.sin(toRadians(r[0]));

	var cosY = Math.cos(toRadians(r[1]));
	var sinY = Math.sin(toRadians(r[1]));

	var cosZ = Math.cos(toRadians(r[2]));
	var sinZ = Math.sin(toRadians(r[2]));

	//x rotation
	// c[1] = cosX * a[1] - sinX * a[2];
	// c[2] = sinX * a[1] + cosX * a[2];

	//y rotation
	c[0] = cosY * a[0] + sinY * a[2];
	c[2] = -sinY * a[0] + cosY * a[2];

	//z rotation
	// c[0] = cosZ * a[0] - sinZ * a[1];
	// c[1] = sinZ * a[0] + cosZ * a[1];

	return c;
}

function addVector(a, b) {
	var c = []

	for (var i = 0; i < a.length; i++) {
		c[i] = a[i] + b[i];
	}

	return c;
}

function subtractVector(a, b) {
	var c = []

	for (var i = 0; i < a.length; i++) {
		c[i] = a[i] - b[i];
	}

	return c;
}

function multiplyVector(a, b) {
	var c = []

	for (var i = 0; i < a.length; i++) {
		c[i] = a[i] * b[i];
	}

	return c;
}

function dotProduct(a, b) {
	var dot = 0;

	for (var i = 0; i < a.length; i++) {
		dot += a[i]*b[i];
	}

	return dot;
}

function crossProduct(a, b) {
	var c = [];

	c[0] = a[1]*b[2] - a[2]*b[1];
	c[1] = a[2]*b[0] - a[0]*b[2];
	c[2] = a[0]*b[1] - a[1]*b[0];

	return c;
}

function normalize(v) {
	var length = Math.sqrt((v[0]*v[0]) + (v[1]*v[1]) + (v[2]*v[2]))

	v[0] = v[0]/length;
	v[1] = v[1]/length;
	v[2] = v[2]/length;

	return v;
}

function isParallel(a, b) {

	if (a[0] % b[0] == 0 && a[1] % b[1] == 0 && a[2] % b[2] == 0) {
		return true;
	} else {
		return false;
	}
}