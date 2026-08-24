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

// The button is only live while something is selected, so it names which of the two
// states it is in rather than sitting there as a dead control with hopeful copy.
function armDelete(armed) {
    deleteButton.classList.toggle('is-armed', armed);
    deleteButton.innerText = armed ? 'Delete selected' : 'Select an object first';
}

canvas.on('selection:created', () => armDelete(true));
canvas.on('selection:updated', () => armDelete(true));
canvas.on('selection:cleared', () => armDelete(false));

deleteButton.addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
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


/* Separation readout.
 *
 * On a press, every distinct flat colour is one screen, and a photograph cannot be
 * separated into flat colours at all — it books the four process screens instead.
 * So the strip under the stage is a real cost signal, not a badge: it is derived
 * from the objects currently on the canvas every time that set changes.
 *
 * The garment itself is the one object added with `selectable: false`, which is what
 * keeps it out of the count. */

const sepChips = document.getElementById('sepChips');
const sepCount = document.getElementById('sepCount');
const sepUnit = document.getElementById('sepUnit');
const sepTally = document.getElementById('sepTally');
const sepEmpty = document.getElementById('sepEmpty');

const PROCESS = 'process';

function inkOf(object) {
    if (object.isType?.('image') || object.type === 'image') return PROCESS;

    const fill = object.fill;
    if (typeof fill !== 'string') return PROCESS; // gradient or pattern: not one ink

    try {
        return '#' + new fabric.Color(fill).toHex().toLowerCase();
    } catch {
        return fill;
    }
}

function renderSeparation() {
    const inks = [...new Set(
        canvas.getObjects().filter((o) => o.selectable !== false).map(inkOf)
    )];

    sepChips.replaceChildren();

    for (const ink of inks) {
        const chip = document.createElement('li');
        chip.className = 'sep__chip';

        const swatch = document.createElement('span');
        swatch.className = 'sep__swatch';
        const label = document.createElement('span');
        label.className = 'sep__code';

        if (ink === PROCESS) {
            swatch.classList.add('sep__swatch--process');
            label.textContent = 'CMYK';
        } else {
            swatch.style.setProperty('--swatch', ink);
            label.textContent = ink.toUpperCase();
        }

        chip.append(swatch, label);
        sepChips.append(chip);
    }

    // Process is four screens on the press, not one.
    const screens = inks.reduce((total, ink) => total + (ink === PROCESS ? 4 : 1), 0);

    sepCount.textContent = String(screens);
    sepUnit.textContent = screens === 1 ? 'screen' : 'screens';
    sepTally.hidden = screens === 0;
    sepEmpty.hidden = screens > 0;
}

canvas.on('object:added', renderSeparation);
canvas.on('object:removed', renderSeparation);
canvas.on('object:modified', renderSeparation);

renderSeparation();


