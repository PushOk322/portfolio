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

function drawBars() {
    const visibleData = chartData.filter(item => item.visible);
    const total = visibleData.reduce((sum, item) => sum + item.price, 0);
    let startAngle = -Math.PI / 2;

    visibleData.forEach((item, index) => {
        const sliceAngle = (item.price / total) * 2 * Math.PI;
        const targetAngle = sliceAngle;

        if (item.currentHeight < targetAngle) {
            item.currentHeight += 0.03;
            if (item.currentHeight > targetAngle) item.currentHeight = targetAngle;
        }


        ctx.beginPath()
        ctx.moveTo(chartWidth / 2, chartHeight / 2);
        ctx.fillStyle = item.color;
        ctx.arc(chartWidth / 2, chartHeight / 2, 300, startAngle, startAngle + item.currentHeight);
        ctx.fill();

        const midAngle = startAngle + item.currentHeight / 2;
        const labelX = chartWidth / 2 + Math.cos(midAngle) * 200;
        const labelY = chartHeight / 2 + Math.sin(midAngle) * 200;


        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.label, labelX, labelY);

        startAngle += item.currentHeight;
    });
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
    drawBars();
    drawButtons();
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
    type: 'pie',
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