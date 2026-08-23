import Chart from 'chart.js/auto';

const firstCanvas = document.getElementById("firstDiagram");
const ctx = firstCanvas.getContext("2d");

const chartWidth = 1000;
const chartHeight = 1000;

firstCanvas.width = chartWidth;
firstCanvas.height = chartHeight;

let weight = 1000;

function RandomNumber(number, number2) {
    return Math.floor(Math.random() * (number2 - number) + number);
}

let chartData = [
    {label: 'wheat', price: RandomNumber(100, 500), color: 'blue', visible: true, currentHeight: 0},
    {label: 'rice', price: RandomNumber(100, 500), color: 'yellow', visible: true, currentHeight: 0},
    {label: 'corn', price: RandomNumber(100, 500), color: 'brown', visible: true, currentHeight: 0},
    {label: 'soybeans', price: RandomNumber(100, 500), color: 'green', visible: true, currentHeight: 0},
    {label: 'cotton', price: RandomNumber(100, 500), color: 'red', visible: true, currentHeight: 0},

    {label: 'wheat', price: RandomNumber(100, 500), color: 'blue', visible: true, currentHeight: 0},
    {label: 'rice', price: RandomNumber(100, 500), color: 'yellow', visible: true, currentHeight: 0},
    {label: 'corn', price: RandomNumber(100, 500), color: 'brown', visible: true, currentHeight: 0},
    {label: 'soybeans', price: RandomNumber(100, 500), color: 'green', visible: true, currentHeight: 0},
    {label: 'cotton', price: RandomNumber(100, 500), color: 'red', visible: true, currentHeight: 0},
]

const maxValue = Math.max(...chartData.map((item) => item.price));
const minValue = 0;

function drawTicks(visibleData, totalPoints, centerX, centerY, maxRadius) {
    const tickCount = maxValue / 100;
    const tickHeight = maxRadius / tickCount * 0.95;
    const tickValue = (maxValue - minValue) / tickCount;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - maxRadius);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;

    for (let i = 0; i <= tickCount; i++) {
        const y = centerY - tickHeight * i;

        ctx.beginPath();
        ctx.moveTo(centerX - 10, y);
        ctx.lineTo(centerX + 10, y);
        ctx.strokeStyle = "black";
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
            Math.round(minValue + i * tickValue),
            centerX - 10,
            y - 10
        );
    }
}

function drawGrid(totalPoints, centerX, centerY, maxRadius) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    const levels = maxValue / 100;
    for (let i = 1; i <= levels; i++) {
        ctx.beginPath();
        for (let j = 0; j <= totalPoints; j++) {
            const angle = (j / totalPoints) * 2 * Math.PI;
            const radius = (i / levels) * maxRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

function drawAxesLabels(visibleData, totalPoints, centerX, centerY, maxRadius) {
    visibleData.forEach((item, i) => {
        const angle = (i / totalPoints) * 2 * Math.PI;
        const x = centerX + maxRadius * Math.cos(angle);
        const y = centerY + maxRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.label, centerX + (maxRadius + 20) * Math.cos(angle), centerY + (maxRadius + 20) * Math.sin(angle));
    });
}


function drawRadarChart() {
    const visibleData = chartData.filter(item => item.visible);
    const totalPoints = visibleData.length;
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const maxRadius = 300;

    drawTicks(visibleData, totalPoints, centerX, centerY, maxRadius);

    drawGrid(totalPoints, centerX, centerY, maxRadius);

    drawAxesLabels(visibleData, totalPoints, centerX, centerY, maxRadius);

    ctx.beginPath();
    visibleData.forEach((item, i) => {
        const angle = (i / totalPoints) * 2 * Math.PI;
        const targetLength = (item.price / maxValue) * maxRadius;

        if (item.currentHeight < targetLength) {
            item.currentHeight += 4;
            if (item.currentHeight > targetLength) item.currentHeight = targetLength;
        }

        const x = centerX + item.currentHeight * Math.cos(angle);
        const y = centerY + item.currentHeight * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.closePath();
    ctx.fillStyle = "rgba(100, 100, 255, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "blue";
    ctx.stroke();
}


function drawButtons() {
    const buttonWidth = 100;
    const buttonHeight = 50;
    const buttonMargin = 10;
    const startX = chartWidth / 4.5;
    const startY = 100;

    let labels = []
    let buttonIndex = 0;

    for (const item of chartData) {
        if (labels.includes(item.label)) continue;
        labels.push(item.label)

        const x = startX + buttonIndex * (buttonWidth + buttonMargin);
        const y = startY;

        ctx.fillStyle = item.visible ? item.color : 'white';
        ctx.fillRect(x, y, buttonWidth, buttonHeight);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(item.label, x + (buttonWidth / 2), y + 30);
        buttonIndex++;
    }

}

function animate() {
    ctx.clearRect(0, 0, chartWidth, chartHeight);
    drawChart();

    const isAnyAnimating = chartData.some(item => {
        if (!item.visible) return false;
        const targetHeight = (item.price - minValue) * ((firstCanvas.height - 350) / (maxValue - minValue));
        return item.currentHeight < targetHeight;
    });

    if (isAnyAnimating) {
        requestAnimationFrame(animate);
    }
}

function drawChart() {
    drawRadarChart();
    drawButtons();
    drawGrid();
    drawTicks;
}

drawChart();
animate()


firstCanvas.addEventListener('click', function (event) {
    const rect = firstCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const buttonWidth = 100;
    const buttonHeight = 50;
    const buttonMargin = 10;
    const startX = chartWidth / 4.5;
    const startY = 100;

    let labels = [];
    let buttonIndex = 0;

    for (const item of chartData) {
        if (labels.includes(item.label)) continue;
        labels.push(item.label);

        const x = startX + buttonIndex * (buttonWidth + buttonMargin);
        const y = startY;

        if (mouseX >= x && mouseX <= x + buttonWidth &&
            mouseY >= y && mouseY <= y + buttonHeight) {
            const clickedLabel = item.label;

            const newVisibility = !item.visible;
            chartData.forEach(dataItem => {
                if (dataItem.label === clickedLabel) {
                    dataItem.visible = newVisibility;
                }
            });

            chartData.forEach(dataItem => {
                dataItem.currentHeight = 0;
            });
            animate();
            break;
        }

        buttonIndex++;
    }
});


const chartCtx = document.getElementById('myChart');

const cropData = [
    {label: 'wheat', price: RandomNumber(100, 500), color: 'blue'},
    {label: 'rice', price: RandomNumber(100, 500), color: 'yellow'},
    {label: 'corn', price: RandomNumber(100, 500), color: 'brown'},
    {label: 'soybeans', price: RandomNumber(100, 500), color: 'green'},
    {label: 'cotton', price: RandomNumber(100, 500), color: 'red'}
];

new Chart(chartCtx, {
    type: 'radar',
    data: {
        labels: cropData.map(item => item.label),
        datasets: [{
            label: 'Crop Prices',
            data: cropData.map(item => item.price),
            backgroundColor: cropData.map(item => item.color),
            borderWidth: 1
        }]
    },
    options: {

        parsing: {
            key: 'price'
        }
    }
});