import * as fabric from "fabric";


const canvas = new fabric.Canvas("myCanvas", {
    width: 600,
    height: 312,
    backgroundColor: "#ae13a6",
});

fabric.Image.fromURL('./t-shirt.jpg', () => {
}, {
    selectable: false,
})
    .then((oImg) => {
        canvas.add(oImg);
    });


const fileInput = document.getElementById('imageUpload')

fileInput.addEventListener('change', (e) => {
    const file = (e.target).files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (f) {
        const dataUrl = f.target?.result;

        fabric.Image.fromURL(dataUrl).then((img) => {
            img.set({
                left: 150,
                top: 150,
                scaleX: 0.5,
                scaleY: 0.5
            });
            canvas.add(img);
            canvas.setActiveObject(img);
        });
    };

    reader.readAsDataURL(file);
});


// Uploading requires the visitor to have an image to hand. This drops a stock mark
// on the shirt in one click, so the compositing is visible immediately.
document.getElementById('sampleButton')?.addEventListener('click', () => {
    fabric.Image.fromURL('./sample-print.png').then((img) => {
        img.set({ left: 220, top: 90, scaleX: 0.4, scaleY: 0.4 });
        canvas.add(img);
        canvas.setActiveObject(img);
    });
});


const deleteButton = document.getElementById('deleter')

canvas.on('selection:created', () => {
    deleteButton.innerText = 'Delete';
});

canvas.on('selection:cleared', () => {
    deleteButton.innerText = 'Choose an object to delete';
});

deleteButton.addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        deleteButton.innerText = 'Delete';
        canvas.remove(activeObject);
    }
});


const textInput = document.getElementById('textInput')
const textButton = document.getElementById('textButton')

textInput.addEventListener('input', () => {
    textButton.disabled = !textInput.value;
});

textButton.addEventListener('click', () => {
    const text = new fabric.Text(textInput.value, {
        left: 100,
        top: 100,
        fontSize: 20,
        fill: 'black',
        zIndex: 3
    });
    canvas.add(text);
    textInput.value = '';
    textButton.disabled = true;
});


document.getElementById('triangleButton')?.addEventListener('click', () => {
    const triangle = new fabric.Triangle({
        left: 300,
        top: 200,
        width: 100,
        height: 100,
        fill: 'green'
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
});

document.getElementById('rectangleButton')?.addEventListener('click', () => {
    const rect = new fabric.Rect({
        left: 200,
        top: 200,
        fill: 'blue',
        width: 100,
        height: 60,
        angle: 0
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
});

document.getElementById('circleButton')?.addEventListener('click', () => {
    const circle = new fabric.Circle({
        left: 250,
        top: 150,
        radius: 50,
        fill: 'red'
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
});


document.getElementById('downloadButton')?.addEventListener('click', () => {
    canvas.toBlob({
        multiplier: 1,
        format: 'jpeg',
        quality: 1,
        enableRetinaScaling: false
    }).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 't-shirt.jpg';
        a.click();
    });
});


