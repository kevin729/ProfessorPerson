var canvas;
var context;

window.addEventListener("load", () => {
	canvas = document.getElementById("can");
	context = canvas.getContext("2d");
	
	initInputs();
	initAssets();
});

function start()
{
	var overWorld = new Overworld();

	setInterval(function(){
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		overWorld.tick();
		overWorld.render();
		
		entities.forEach(function(e) {
			e.tick();
			e.render();
		});
	}, 30);
}


