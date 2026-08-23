const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.style.cursor = 'none';


const particlesQuantity = 50
const maxDistanceForConnection = 100;
const speed = 15;


function drawParticle(x, y, isCursor = false) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isCursor ? "red" : "black";
    ctx.fill();

    if (isCursor) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
    }
}


const particlesPositions = Array.from({length: particlesQuantity}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    stepX: Math.random() * speed,
    stepY: Math.random() * speed,
    isCursor: false
}));

particlesPositions[0].isCursor = true;

document.addEventListener('mousemove', (e) => {
    particlesPositions[0].x = e.clientX;
    particlesPositions[0].y = e.clientY;
});

function moveParticles() {
    particlesPositions.forEach((circle) => {
        if (circle.isCursor) return;

        circle.x += circle.stepX;
        circle.y += circle.stepY;

        if (circle.x > canvas.width || circle.x < 0) {
            circle.stepX = -circle.stepX;
        }
        if (circle.y > canvas.height || circle.y < 0) {
            circle.stepY = -circle.stepY;
        }
    });
}

function drawConnections() {
    particlesPositions.forEach((particle1, index1) => {
        particlesPositions.forEach((particle2, index2) => {
            if (index1 !== index2) {
                const distance = Math.sqrt(
                    (particle1.x - particle2.x) ** 2 + (particle1.y - particle2.y) ** 2
                );

                if (distance < maxDistanceForConnection) {
                    ctx.beginPath();
                    ctx.moveTo(particle1.x, particle1.y);
                    ctx.lineTo(particle2.x, particle2.y);

                    const isConnectedToCursor = particle1.isCursor || particle2.isCursor;
                    const color = isConnectedToCursor ? "255, 0, 0" : "0, 0, 0";
                    ctx.strokeStyle = `rgba(${color}, ${1 - distance / maxDistanceForConnection})`;
                    ctx.stroke();
                }
            }
        });
    });
}


function animateOneFrame() {
    requestAnimationFrame(animateOneFrame);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "yellow";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    moveParticles();
    drawConnections();

    particlesPositions.forEach((circle) => {
        drawParticle(circle.x, circle.y, circle.isCursor);
    });
}


animateOneFrame();
