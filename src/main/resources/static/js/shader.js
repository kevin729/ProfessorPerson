var projMatrix = new Float32Array(16)

function setupShader() {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width/canvas.height, 0.1, 10000)

	var vertexText =
	[
		'precision mediump float;',
		'attribute vec3 coordinates;',
		'attribute vec2 texCoord;',
		'attribute vec3 normals;',
		'attribute vec4 aColour;',
		'varying vec3 toLight;',
		'varying vec3 toCamera;',
		'varying vec4 frag_colour;',
		'varying vec2 texture_Co;',
		'varying vec3 surfaceNormal;',
		'uniform float useFakeLighting;',
		'uniform vec3 lightPosition;',
		'uniform vec3 cameraPosition;',
		'uniform mat4 transform;',
		'uniform mat4 view;',
		'uniform mat4 projection;',
		'vec4 worldPosition;',
		'void main() {',
		'	frag_colour = aColour;',
		'	texture_Co = texCoord;',
		'	worldPosition = transform * vec4(coordinates, 1);',
		'	vec3 _normals = normals;',
		'   if (useFakeLighting > 0.5){',
		'		_normals = vec3(0.0, 1.0, 0.0);',
		'	}',
		'	surfaceNormal = (transform*vec4(_normals, 0)).xyz;',
		'	toCamera = cameraPosition - worldPosition.xyz;',
		'	toLight = -lightPosition;',
		'	gl_Position = projection * view * worldPosition;',
		'}'
	].join('\n')

	var fragmentText =
	[
		'precision mediump float;',
		'varying vec2 texture_Co;',
		'varying vec4 frag_colour;',
		'varying vec3 toLight;',
		'varying vec3 toCamera;',
		'varying vec3 surfaceNormal;',
		'uniform sampler2D texture;', //TEXTURE0
		'uniform float useTexture;',
		'uniform float reflectivity;',
		'uniform float shineDamp;',
		'vec3 lightColour = vec3(1, 1, 1);',
		'void main() {',
		'	vec4 colour = frag_colour;',
		'	colour = texture2D(texture, texture_Co);',
		'	if (useTexture < 0.5) {',
		'		colour = frag_colour;',
		'	}',
		'	if(colour.a<0.5){',
		'		discard;',
		'	}',
		'	vec3 unitNormal = normalize(surfaceNormal);',
		'	vec3 unitToLight = normalize(toLight);',
		'	vec3 unitToCamera = normalize(toCamera);',
		'	vec3 lightDirection = -unitToLight;',
		'	float dot1 = dot(unitNormal, unitToLight);',
		'	float brightness = max(dot1, 0.2);',
		'	vec3 diffuse = brightness * lightColour;',
		'	vec3 reflectedLightDirection = reflect(lightDirection, unitNormal);',
		'	float specularFactor = dot(reflectedLightDirection, unitToCamera);',
		'	specularFactor = max(specularFactor, 0.0);',
		'	float dampedFactor = pow(specularFactor, shineDamp);',
		'	vec3 finalSpecular = dampedFactor * reflectivity * lightColour;',
		'	gl_FragColor = vec4(diffuse, 1.0) * colour + vec4(finalSpecular, 1.0);',
		'}'
	].join('\n')

	var vertexShader = gl.createShader(gl.VERTEX_SHADER)
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

	gl.shaderSource(vertexShader, vertexText)
	gl.shaderSource(fragmentShader, fragmentText)

	gl.compileShader(vertexShader)
	gl.compileShader(fragmentShader)

	var program = gl.createProgram()
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)
	gl.validateProgram(program)

	console.log(gl.getShaderInfoLog(vertexShader))
	console.log(gl.getShaderInfoLog(fragmentShader))

	var coordinatesLocation = gl.getAttribLocation(program, "coordinates")
	var texCoordLocation = gl.getAttribLocation(program, "texCoord")
	var normalsLocation = gl.getAttribLocation(program, "normals")
	var colourLocation = gl.getAttribLocation(program, "aColour")
	var transformLocation = gl.getUniformLocation(program, "transform")
	var viewLocation = gl.getUniformLocation(program, "view")
	var useTextureLocation = gl.getUniformLocation(program, "useTexture")
	var lightPositionLocation = gl.getUniformLocation(program, "lightPosition")
	var cameraPositionLocation = gl.getUniformLocation(program, "cameraPosition")
	var reflectivityLocation = gl.getUniformLocation(program, "reflectivity")
	var shineDampLocation = gl.getUniformLocation(program, "shineDamp")
	var useFakeLightingLocation = gl.getUniformLocation(program, "useFakeLighting")

	var projectionLocation = gl.getUniformLocation(program, "projection")

	gl.useProgram(program)
	gl.uniformMatrix4fv(projectionLocation, gl.FALSE, projMatrix)
	gl.useProgram(null)

	shader = {
		program,
		coordinatesLocation,
		texCoordLocation,
		normalsLocation,
		colourLocation,
		transformLocation,
		viewLocation,
		lightPositionLocation,
		cameraPositionLocation,
		reflectivityLocation,
		shineDampLocation,
		useTextureLocation,
		useFakeLightingLocation
	}
}
