var TILESIZE = 64;
var entityList = [];
var entities = [];
var tiles = [];
var keys = [];
var editor;
var mouseX = 0;
var mouseY = 0;

var mouseLeftClicked = false;
var mouseRightClicked = false;

var entityLeft = -1;
var entityRight = -1;

var tileLeftDropDown;
var tileRightDropDown;

function getMousePressed(e) {
	var clicked
	switch (e) {
		case 1:
			clicked = mouseLeftClicked;
			mouseLeftClicked = false;
			break;
		case 3:
			clicked = mouseRightClicked;
			mouseRightClicked = false;
			break;
	}
	
	return clicked;
}

function initInputs() {
	
	tileLeftDropDown = document.getElementById("tileLeftDropDown");
	tileRightDropDown = document.getElementById("tileRightDropDown");
	
	window.addEventListener("keydown", function(e){
		keys[e.keyCode] = true;
	}, false);

	window.addEventListener("keyup", function(e){
		keys[e.keyCode] = false;
	}, false);
	
	canvas.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    }, false);

	canvas.addEventListener("mousemove", e => {
		mouseX = e.offsetX;
		mouseY = e.offsetY;	
	});

	canvas.addEventListener("mousedown", e => {
		switch (e.which) {
			case 1:
				mouseLeftClicked = true;
				break;
			case 3:
				mouseRightClicked = true;
				break;
		}
	});
	
	canvas.addEventListener("mouseup", e => {
		switch (e.which) {
			case 1:
				mouseLeftClicked = false;
				break;
			case 3:
				mouseRightClicked = false;
				break;
		}
	});
	
	canvas.addEventListener("mouseleave", e => {
		mouseLeftClicked = false;
		mouseRightClicked = false;
	})
	
	canvas.addEventListener("touchstart", e => {
		e.preventDefault();

		mouseX = e.touches[0].pageX - canvas.offsetLeft;
		mouseY = e.touches[0].pageY - canvas.offsetTop;
		
		mouseLeftClicked = true;
	});
	
	canvas.addEventListener("touchmove", e => {
		e.preventDefault();

		mouseX = e.touches[0].pageX - canvas.offsetLeft;
		mouseY = e.touches[0].pageY - canvas.offsetTop;
		
		mouseLeftClicked = true;
	});
	
	canvas.addEventListener("touchend", e => {
		e.preventDefault();
		
		mouseLeftClicked = false;
	});
}

function toRadians(degrees)
{
	return degrees*(Math.PI/180);
}

function toDegrees(degrees)
{
	return degrees*(180/Math.PI);
}