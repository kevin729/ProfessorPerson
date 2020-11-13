var canvas = document.getElementById("can")
var gl

function init() {
	gl = canvas.getContext('webgl')

	if (!gl)
		gl = canvas.getContext('experimental-webgl')
	if (!gl)
		alert('Your browser does not support webgl')


   	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

	gl.enable(gl.DEPTH_TEST)
	gl.enable(gl.CULL_FACE)

	setupShader()
	loadTextures(0, initObjects)
}

function start() {
	window.requestAnimationFrame(loop)
}

function loop() {
	gl.clearColor(0, 0, 0, 1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	for (i = 0; i < models.length; i++) {
		earth.rotation[1] += 0.05
		render(models[i])

		orbitOrigin()
	}

	window.requestAnimationFrame(loop)
}

var angle = 0;
var orbitDistance = 50
var speed = 0.1

function orbitOrigin() {
	if (keys[37]) {
		orbitDistance -= 0.05
	} else if (keys[39]) {
		orbitDistance += 0.05
	}

	orbitDistance = Math.max(15, orbitDistance)

	if (keys[38]) {
		speed += 0.001
	} else if (keys[40]) {
		speed -= 0.001
	}

	var x = Math.sin(angle) * orbitDistance
	var z = Math.cos(angle) * orbitDistance

	satellite.position[0] = x
	satellite.position[2] = z

	satellite.rotation[1] += speed


	angle += toRadians(speed)
}

var clicked = false
var oX, oY
var distance = 30

angleAround = 0
angleOver = 0

canvas.addEventListener("mousedown", function(e) {
	if (e.which == 1) {
		clicked = true
		oX = e.clientX
		oY = e.clientY
	} 
})

canvas.addEventListener("mousemove", function(e) {
	if (clicked) {

		dX = oX - e.clientX
		dY = oY - e.clientY

		if (keys[16] || keys[18]) {
			if (keys[16]) {
				camera.x += Math.cos(toRadians(angleAround)) * dX/10
				origin[0] += Math.cos(toRadians(angleAround)) * dX/10

				camera.z -= Math.sin(toRadians(angleAround)) * dX/10
				origin[2] -= Math.sin(toRadians(angleAround)) * dX/10
			}

			if (keys[18]) {

				camera.x -= Math.sin(toRadians(angleOver)) * Math.sin(toRadians(angleAround)) * dY/10
				origin[0] -= Math.sin(toRadians(angleOver)) * Math.sin(toRadians(angleAround)) * dY/10

				camera.y -= Math.cos(toRadians(angleOver)) * dY/10
				origin[1] -= Math.cos(toRadians(angleOver)) * dY/10

				camera.z -= Math.sin(toRadians(angleOver)) * Math.cos(toRadians(angleAround)) * dY/10
				origin[2] -= Math.sin(toRadians(angleOver)) * Math.cos(toRadians(angleAround)) * dY/10
			}
		} else {
			if (angleOver > 90 && angleOver < 270 || angleOver < -90 && angleOver > -270) {
				angleAround -= (dX * 0.5)
			} else if (angleOver > 270 || angleOver < -270) {
				angleAround += (dX * 0.5)
			} else {
				angleAround += (dX * 0.5)
			}

			angleOver += (dY * 0.5)
			angleOver = angleOver % 360
			camera.x = distance * Math.sin(toRadians(angleAround)) * Math.cos(toRadians(angleOver)) + origin[0]
			camera.y = distance * -Math.sin(toRadians(angleOver)) + origin[1]
			camera.z = distance * Math.cos(toRadians(angleAround)) * Math.cos(toRadians(angleOver)) + origin[2]
			
		}

		oX = e.clientX
		oY = e.clientY
	}
})

canvas.addEventListener("mouseup", function(e) {
	clicked = false
	e.preventDefault();
})

canvas.addEventListener("wheel", function(e) {
	distance += e.deltaY

	distance = Math.max(11, distance)

	camera.x = distance * Math.sin(toRadians(angleAround)) * Math.cos(toRadians(angleOver)) + origin[0]
	camera.y = distance * -Math.sin(toRadians(angleOver)) + origin[1]
	camera.z = distance * Math.cos(toRadians(angleAround)) * Math.cos(toRadians(angleOver)) + origin[2]
	

	e.preventDefault();
})

window.addEventListener("keydown", function(e) {
	keys[e.keyCode] = true
	e.preventDefault()
})

window.addEventListener("keyup", function(e) {
	keys[e.keyCode] = false
	e.preventDefault()
})