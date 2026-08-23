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

function drawTicks() {
    const tickCount = 10;
    const tickHeight = (chartHeight - 350) / tickCount;
    const tickValue = (maxValue - minValue) / tickCount;

    ctx.beginPath();
    ctx.moveTo(55, 250);
    ctx.lineTo(55, chartHeight - 100);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;

    for (let i = 0; i <= tickCount; i++) {
        const y = chartHeight - 100 - i * tickHeight;

        ctx.beginPath();
        ctx.moveTo(45, y);
        ctx.lineTo(65, y);
        ctx.strokeStyle = "black";
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
            Math.round(minValue + i * tickValue),
            35,
            y + 5
        );
    }
}

function drawBars() {
    const visibleData = chartData.filter(item => item.visible);
    const barWidth = (firstCanvas.width - 200) / visibleData.length;
    const barHeightScale = (firstCanvas.height - 350) / (maxValue - minValue);

    visibleData.forEach((item, index) => {
        const targetHeight = (item.price - minValue) * barHeightScale;

        if (item.currentHeight < targetHeight) {
            item.currentHeight += 20;
            if (item.currentHeight > targetHeight) item.currentHeight = targetHeight;
        }

        const x = index * barWidth + 120;
        const y = firstCanvas.height - 100 - item.currentHeight;

        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, barWidth - 2, item.currentHeight);

        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.label, x + barWidth / 2, firstCanvas.height - 50);
        ctx.fillText(item.price, x + barWidth / 2, y - 10);
    });
}


function drawButtons() {
    const buttonWidth = 100;
    const buttonHeight = 50;
    const buttonMargin = 10;
    const startX = 100;
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
    drawTicks();
    drawBars();
    drawButtons();
}

drawChart();
animate();


firstCanvas.addEventListener('click', function (event) {
    const rect = firstCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const buttonWidth = 100;
    const buttonHeight = 50;
    const buttonMargin = 10;
    const startX = 100;
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

let libChartData1 = [
    {label: 'wheat', price: RandomNumber(100, 500), color: 'blue', visible: true, currentHeight: 0},
    {label: 'wheat', price: RandomNumber(100, 500), color: 'blue', visible: true, currentHeight: 0},
]

let libChartData2 = [
    {label: 'rice', price: RandomNumber(100, 500), color: 'yellow', visible: true, currentHeight: 0},
    {label: 'rice', price: RandomNumber(100, 500), color: 'yellow', visible: true, currentHeight: 0},
]

let libChartData3 = [
    {label: 'corn', price: RandomNumber(100, 500), color: 'brown', visible: true, currentHeight: 0},
    {label: 'corn', price: RandomNumber(100, 500), color: 'brown', visible: true, currentHeight: 0},
]

let libChartData4 = [
    {label: 'soybeans', price: RandomNumber(100, 500), color: 'green', visible: true, currentHeight: 0},
    {label: 'soybeans', price: RandomNumber(100, 500), color: 'green', visible: true, currentHeight: 0},
]

let libChartData5 = [
    {label: 'cotton', price: RandomNumber(100, 500), color: 'red', visible: true, currentHeight: 0},
    {label: 'cotton', price: RandomNumber(100, 500), color: 'red', visible: true, currentHeight: 0},
]

new Chart(chartCtx, {
    type: 'bar',
    data: {
        labels: ['1950', '1975'],
        datasets: [{
            label: libChartData1[0].label,
            data: libChartData1.map(item => item.price),
            borderColor: libChartData1.map(item => item.color),
            borderWidth: 1
        },
            {
                label: libChartData2[0].label,
                data: libChartData2.map(item => item.price),
                borderColor: libChartData2.map(item => item.color),
                borderWidth: 1
            },
            {
                label: libChartData3[0].label,
                data: libChartData3.map(item => item.price),
                borderColor: libChartData3.map(item => item.color),
                borderWidth: 1
            },
            {
                label: libChartData4[0].label,
                data: libChartData4.map(item => item.price),
                borderColor: libChartData4.map(item => item.color),
                borderWidth: 1
            },
            {
                label: libChartData5[0].label,
                data: libChartData5.map(item => item.price),
                borderColor: libChartData5.map(item => item.color),
                borderWidth: 1
            },
        ]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});