var fboResolution = 256;

var FBOs = function() {

	this.reflectionFBO;
	this.reflectionTexture;
	this.reflectionDepthBuffer;

	this.refractionFBO;
	this.refractionTexture;
	this.refractionDepthTexture;

	this.createFBO = function() {
		var fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

		return fbo;
	}

	this.createTextureAttachment = function() {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, fboResolution, fboResolution, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        return texture;
	}

	this.createDepthTextureAttachment = function() {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);	
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);

        return texture;
	}

	this.createDepthBufferAttachment = function() {
		var depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fboResolution, fboResolution);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

		return depthBuffer;
	}

	this.createReflectionFBO = function() {
		this.reflectionFBO = this.createFBO();
		this.reflectionTexture = this.createTextureAttachment();
		this.reflectionDepthBuffer = this.createDepthBufferAttachment();
		this.unbindFBO();
	}

	this.createRefractionFBO = function() {
		this.refractionFBO = this.createFBO();
		this.refractionTexture = this.createTextureAttachment();
		this.refractionDepthTexture = this.createDepthBufferAttachment();
		this.unbindFBO();
	}

	this.bindFBO = function(frameBuffer) {
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		gl.viewport(0, 0, fboResolution, fboResolution)
	}


	this.unbindFBO = function() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, canvas.width, canvas.height);
	}

	this.createReflectionFBO();
	this.createRefractionFBO();
}