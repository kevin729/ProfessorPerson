
function loadTransformation(model) {
	var transformMat = new Float32Array(16)
	mat4.identity(transformMat)

	mat4.translate(transformMat, transformMat, [model.position[0], model.position[1], model.position[2]])
	
	mat4.rotate(transformMat, transformMat, toRadians(model.rotation[0]), [1, 0, 0])
	mat4.rotate(transformMat, transformMat, toRadians(model.rotation[1]), [0, 1, 0])
	mat4.rotate(transformMat, transformMat, toRadians(model.rotation[2]), [0, 0, 1])

	mat4.scale(transformMat, transformMat, [model.scale[0], model.scale[1], model.scale[2]])
	return transformMat
}

function loadView() {
	var viewMatrix = new Float32Array(16)
	mat4.identity(viewMatrix)
	mat4.lookAt(viewMatrix, [camera.x, camera.y, camera.z], origin, [Math.sin(toRadians(angleOver)) * Math.sin(toRadians(angleAround)), Math.cos(toRadians(angleOver)), Math.sin(toRadians(angleOver)) * Math.cos(toRadians(angleAround))])
	
	gl.uniform3f(shader.cameraPositionLocation, camera.x, camera.y, camera.z)

	return viewMatrix
}

function loadLight() {
	gl.uniform3f(shader.lightPositionLocation, light.position[0], light.position[1], light.position[2])
}

function loadShine(model) {
	gl.uniform1f(shader.reflectivityLocation, model.reflect)
	gl.uniform1f(shader.shineDampLocation, model.shineDamp)
}

function drawCube(position, rotation, scale) {
	cubeModel.position = position
	cubeModel.rotation = rotation
	cubeModel.scale = scale

	render(cubeModel)
}

function render(model) {
	gl.useProgram(shader.program)

	gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iBuffer)

	//points attribute location to bounded vbo (vertices and indices)
	gl.vertexAttribPointer(shader.coordinatesLocation, 3, gl.FLOAT, false, 0, 0)

	if (model.useTexture) {
		gl.bindBuffer(gl.ARRAY_BUFFER, model.tBuffer)

		//points attibute location to bounded vbo (textureCo)
		gl.vertexAttribPointer(shader.texCoordLocation, 2, gl.FLOAT, false, 0, 0)
	} else {
		gl.bindBuffer(gl.ARRAY_BUFFER, model.cBuffer)
		gl.vertexAttribPointer(shader.colourLocation, 4, gl.FLOAT, false, 0, 0)
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer)
	gl.vertexAttribPointer(shader.normalsLocation, 3, gl.FLOAT, false, 0, 0)
	
	//points uniform location to light position
	loadLight()
	loadShine(model)
	//points uniform location to matrix
	gl.uniformMatrix4fv(shader.transformLocation, gl.FALSE, loadTransformation(model))

	//points uniform location to matrix
	gl.uniformMatrix4fv(shader.viewLocation, gl.FALSE, loadView())

	//lets shader know if using texture or colour
	gl.uniform1f(shader.useTextureLocation, model.useTexture)

	gl.bindTexture(gl.TEXTURE_2D, model.textureVBO)

	//points texture0 in shader to bounded texture
	gl.activeTexture(gl.TEXTURE0)

	gl.enableVertexAttribArray(shader.coordinatesLocation)

	if (model.useTexture) {
		gl.enableVertexAttribArray(shader.texCoordLocation)
	} else {
		gl.enableVertexAttribArray(shader.colourLocation)
	}
	
	gl.enableVertexAttribArray(shader.normalsLocation)

	gl.drawElements(model.drawMethod, model.indices.length, gl.UNSIGNED_SHORT, 0)

	gl.disableVertexAttribArray(shader.coordinatesLocation)
	gl.disableVertexAttribArray(shader.texCoordLocation)
	gl.disableVertexAttribArray(shader.colourLocation)
	gl.disableVertexAttribArray(shader.normalsLocation)

	gl.useProgram(null)
}