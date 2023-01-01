function loadTransformation(entity) {
	var transformMat = new Float32Array(16)
	mat4.identity(transformMat)

	mat4.translate(transformMat, transformMat, [entity.position[0], entity.position[1], entity.position[2]])

	mat4.rotate(transformMat, transformMat, toRadians(entity.rotation[0]), [1, 0, 0])
	mat4.rotate(transformMat, transformMat, toRadians(entity.rotation[1]), [0, 1, 0])
	mat4.rotate(transformMat, transformMat, toRadians(entity.rotation[2]), [0, 0, 1])

	mat4.scale(transformMat, transformMat, [entity.scale[0], entity.scale[1], entity.scale[2]])
	return transformMat
}

function loadView() {
	var viewMatrix = new Float32Array(16)
	mat4.identity(viewMatrix)
	mat4.translate(viewMatrix, viewMatrix, [-camera.x, -camera.y, -camera.z])
	gl.uniform3f(shader.cameraPositionLocation, camera.x, camera.y, camera.z)

	return viewMatrix
}

function loadLight() {
	gl.uniform3f(shader.lightPositionLocation, light.position[0], light.position[1], light.position[2])
}

function loadShine(entity) {
	gl.uniform1f(shader.reflectivityLocation, entity.reflection)
	gl.uniform1f(shader.shineDampLocation, entity.shineDamp)
}

function drawCube(position, rotation, scale) {
	cubeModel.position = position
	cubeModel.rotation = rotation
	cubeModel.scale = scale

	render(cubeModel)
}

function render() {
  for (i = 0; i < entities.length; i++) {
    var entity = entities[i]
    var model = entity.model

    	if (entity.useTexture) {
    		if (entity.texture.disableCull != null) {
    			gl.disable(gl.CULL_FACE)
    		} else {
    			gl.enable(gl.CULL_FACE)
    		}
    	} else {
    		gl.enable(gl.CULL_FACE)
    	}

    	gl.useProgram(shader.program)

    	//points attribute location to bounded vbo (vertices and indices)
    	gl.bindBuffer(gl.ARRAY_BUFFER, model.vBuffer)
    	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.iBuffer)
    	gl.vertexAttribPointer(shader.coordinatesLocation, 3, gl.FLOAT, false, 0, 0)

    	//points attibute location to bounded vbo (textureCo)
    	gl.bindBuffer(gl.ARRAY_BUFFER, model.tBuffer)
    	gl.vertexAttribPointer(shader.texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    	gl.bindBuffer(gl.ARRAY_BUFFER, model.cBuffer)
    	gl.vertexAttribPointer(shader.colourLocation, 4, gl.FLOAT, false, 0, 0)


    	gl.bindBuffer(gl.ARRAY_BUFFER, model.nBuffer)
    	gl.vertexAttribPointer(shader.normalsLocation, 3, gl.FLOAT, false, 0, 0)

    	//points uniform location to light position
    	loadLight()
    	loadShine(entity)
    	//points uniform location to matrix
    	gl.uniformMatrix4fv(shader.transformLocation, gl.FALSE, loadTransformation(entity))

    	//points uniform location to matrix
    	gl.uniformMatrix4fv(shader.viewLocation, gl.FALSE, loadView())

    	//lets shader know if using texture or colour
    	gl.uniform1f(shader.useTextureLocation, entity.useTexture)

    	if (entity.useTexture) {
    		gl.uniform1f(shader.useFakeLightingLocation, entity.texture.useFakeLighting)
    	}

    	if (entity.useTexture) {
    		gl.bindTexture(gl.TEXTURE_2D, entity.texture.textureVBO)
    		//points texture0 in shader to bounded texture
    		gl.activeTexture(gl.TEXTURE0)
    	}

    	//enable loacations
    	gl.enableVertexAttribArray(shader.coordinatesLocation)
    	gl.enableVertexAttribArray(shader.texCoordLocation)
    	gl.enableVertexAttribArray(shader.colourLocation)
    	gl.enableVertexAttribArray(shader.normalsLocation)

    	gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0)

    	gl.disableVertexAttribArray(shader.coordinatesLocation)
    	gl.disableVertexAttribArray(shader.texCoordLocation)
    	gl.disableVertexAttribArray(shader.colourLocation)
    	gl.disableVertexAttribArray(shader.normalsLocation)

    	gl.useProgram(null)
  }
}
