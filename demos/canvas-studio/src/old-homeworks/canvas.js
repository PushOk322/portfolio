//canvas
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

const drawInitialCanvas = () =>{
	// COSMO
	ctx.font = "bold 100px Arial";
	ctx.textAlign = "center";
	ctx.fillStyle = "white";
	ctx.fillText("COSMO", 843, 218);

	ctx.globalCompositeOperation = "destination-out";
	ctx.font = "bold 100px Arial";
	ctx.textAlign = "center";
	ctx.fillText("COSMO", 845, 220);

// PLANETARY
	const planetaryCoordinatesX = 320;
	const planetaryCoordinatesY = 350;

	ctx.beginPath();
	ctx.arc(planetaryCoordinatesX, planetaryCoordinatesY, 60, 0, Math.PI * 2);
	ctx.fill();

	const orbits = [160, 210, 260];
	ctx.lineWidth = 3;
	orbits.forEach((radius) => {
		ctx.beginPath();
		ctx.arc(
			planetaryCoordinatesX,
			planetaryCoordinatesY,
			radius,
			0,
			Math.PI * 2
		);
		ctx.stroke();
	});

	orbits.forEach((radius, i) => {
		const angle = 180 * (i + 1);
		const x = planetaryCoordinatesX + radius * Math.cos(angle);
		const y = planetaryCoordinatesY + radius * Math.sin(angle);

		ctx.globalCompositeOperation = "source-over";

		ctx.beginPath();
		ctx.arc(x, y, 30, 0, Math.PI * 2);
		ctx.fillStyle = "black";
		ctx.fill();

		ctx.globalCompositeOperation = "destination-out";

		ctx.beginPath();
		ctx.arc(x, y, 20, 0, Math.PI * 2);
		ctx.fill();
	});

	ctx.globalCompositeOperation = "source-over";

	ctx.lineCap = "round";

//FIRST LINE

	ctx.beginPath();
	ctx.arc(
		planetaryCoordinatesX,
		planetaryCoordinatesY,
		350,
		(2 * Math.PI) / 3,
		Math.PI / 6,
		true
	);
	ctx.strokeStyle = "white";
	ctx.lineWidth = 12;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(
		planetaryCoordinatesX,
		planetaryCoordinatesY,
		350,
		(2 * Math.PI) / 3,
		Math.PI / 6,
		true
	);
	ctx.strokeStyle = "black";
	ctx.lineWidth = 8;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(
		planetaryCoordinatesX,
		planetaryCoordinatesY,
		350,
		(2 * Math.PI) / 3,
		Math.PI / 6,
		true
	);
	ctx.strokeStyle = "white";
	ctx.lineWidth = 3;
	ctx.stroke();

//SECOND LINE

	ctx.beginPath();
	ctx.moveTo(planetaryCoordinatesX + 320, planetaryCoordinatesY + 80);
	ctx.quadraticCurveTo(
		planetaryCoordinatesX + 350,
		planetaryCoordinatesY - 100,
		planetaryCoordinatesX + 420,
		planetaryCoordinatesY - 100
	);
	ctx.lineTo(planetaryCoordinatesX + 600, planetaryCoordinatesY - 100);
	ctx.strokeStyle = "white";
	ctx.lineWidth = 12;
	ctx.lineCap = "round";
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(planetaryCoordinatesX + 320, planetaryCoordinatesY + 80);
	ctx.quadraticCurveTo(
		planetaryCoordinatesX + 350,
		planetaryCoordinatesY - 100,
		planetaryCoordinatesX + 420,
		planetaryCoordinatesY - 100
	);
	ctx.lineTo(planetaryCoordinatesX + 600, planetaryCoordinatesY - 100);
	ctx.strokeStyle = "black";
	ctx.lineWidth = 8;
	ctx.lineCap = "round";
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(planetaryCoordinatesX + 320, planetaryCoordinatesY + 80);
	ctx.quadraticCurveTo(
		planetaryCoordinatesX + 350,
		planetaryCoordinatesY - 100,
		planetaryCoordinatesX + 420,
		planetaryCoordinatesY - 100
	);
	ctx.lineTo(planetaryCoordinatesX + 600, planetaryCoordinatesY - 100);
	ctx.strokeStyle = "white";
	ctx.lineWidth = 3;
	ctx.lineCap = "round";
	ctx.stroke();

//THIRD LINE

	ctx.beginPath();
	ctx.arc(
		planetaryCoordinatesX + 650,
		planetaryCoordinatesY - 200,
		100,
		Math.PI / 2,
		Math.PI * 2,
		true
	);
	ctx.strokeStyle = "white";
	ctx.lineWidth = 12;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(
		planetaryCoordinatesX + 650,
		planetaryCoordinatesY - 200,
		100,
		Math.PI / 2,
		Math.PI * 2,
		true
	);
	ctx.strokeStyle = "black";
	ctx.lineWidth = 8;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(
		planetaryCoordinatesX + 650,
		planetaryCoordinatesY - 200,
		100,
		Math.PI / 2,
		Math.PI * 2,
		true
	);
	ctx.strokeStyle = "white";
	ctx.lineWidth = 3;
	ctx.stroke();
}

drawInitialCanvas();

// STAR DRAWI

const stars = [];

const starImg = new Image();
starImg.src = "./star.png";

const rectStarsCanvas = { x: 700, y: 300, width: 450, height: 400 };

const drawStarsCanvas=()=>{
	ctx.save();
	const gradient = ctx.createLinearGradient(
		rectStarsCanvas.x,
		rectStarsCanvas.y,
		rectStarsCanvas.x + rectStarsCanvas.width,
		rectStarsCanvas.y
	);
	gradient.addColorStop(0, "rgba(101, 197, 235, 1)");
	gradient.addColorStop(0.5, "rgba(43, 147, 166, 1)");
	gradient.addColorStop(1, "rgba(21, 71, 115, 1)");
	ctx.fillStyle = gradient;
	ctx.lineWidth = 4;
	ctx.fillRect(rectStarsCanvas.x, rectStarsCanvas.y, rectStarsCanvas.width, rectStarsCanvas.height);
	ctx.restore();
}
drawStarsCanvas();


function drawStars() {
	stars.forEach(({ x, y }) => {
		ctx.drawImage(starImg, x - 24, y - 24, 48, 48);
	});
}

canvas.addEventListener("click", (e) => {
	const rectCanvas = canvas.getBoundingClientRect();
	const x = e.clientX - rectCanvas.left;
	const y = e.clientY - rectCanvas.top;

	if (
		x >= rectStarsCanvas.x &&
		x <= rectStarsCanvas.x + rectStarsCanvas.width &&
		y >= rectStarsCanvas.y &&
		y <= rectStarsCanvas.y + rectStarsCanvas.height
	) {
		stars.push({ x, y });
		drawStars();
	}
});


const resetCanvas = () => {
	// Clear the entire canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Redraw the black background
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	drawStarsCanvas()

	stars.length = 0;
	drawInitialCanvas();
	drawStars();
};

const resetLastStar = () => {
	// Clear the entire canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Redraw the black background
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Remove the last star
	stars.pop();

	// Redraw everything in the correct order
	drawInitialCanvas();
	drawStarsCanvas();
	drawStars();
};


document.getElementById("resetOne").onclick = resetLastStar;
document.getElementById("resetAll").onclick = resetCanvas;
document.getElementById("reload").onclick = () => {
	window.location.reload();
};

