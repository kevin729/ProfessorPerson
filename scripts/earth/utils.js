function toRadians(degrees) {
	return degrees*(Math.PI/180)
}

function crossProduct(a, b) {
	var c = [];

	c[0] = a[1]*b[2] - a[2]*b[1];
	c[1] = a[2]*b[0] - a[0]*b[2];
	c[2] = a[0]*b[1] - a[1]*b[0];

	return c;
}

function normalise(v) {
	var length = Math.sqrt((v[0]*v[0]) + (v[1]*v[1]) + (v[2]*v[2]))

	v[0] = v[0]/length;
	v[1] = v[1]/length;
	v[2] = v[2]/length;

	return v;
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

function invertVector(v) {
	var c = []
	c[0] = -v[0]
	c[1] = -v[1]
	c[2] = -v[2]

	return c
}