import Konva from 'konva';

let stage = new Konva.Stage({
    container: 'container',
    width: 1000,
    height: 700,
});

let layer = new Konva.Layer();

let sceneBackground = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: 'red',
    stroke: 'black',
    strokeWidth: 4,
});

layer.add(sceneBackground);

let zaglushka1 = new Konva.Image({
    x: 500,
    y: 500,
    width: 100,
    height: 100,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 4,
});

let zaglushka2 = new Konva.Image({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 4,
});

layer.add(zaglushka1);
layer.add(zaglushka2);

function handleImageUpload(fileInput, targetObject) {
    fileInput.addEventListener('change', (e) => {
        const file = (e.target).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (f) {
            const dataUrl = f.target?.result;
            const imageObj = new Image();
            imageObj.src = dataUrl;
            imageObj.onload = function () {
                targetObject.image(imageObj);
                targetObject.width(106);
                targetObject.height(118);
                targetObject.fill(null);
                layer.batchDraw();
            };
        };
        reader.readAsDataURL(file);
    });
}

const fileInput1 = document.getElementById('imageUpload1')
const fileInput2 = document.getElementById('imageUpload2')

handleImageUpload(fileInput1, zaglushka1)
handleImageUpload(fileInput2, zaglushka2)

stage.add(layer);

const anim = new Konva.Animation(function (frame) {
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;
    const radius = 100;
    const angle = frame.time * 2 * Math.PI / 2000;

    const x1 = radius * Math.cos(angle) + centerX;
    const y1 = radius * Math.sin(angle) + centerY;

    const x2 = radius * Math.cos(angle + Math.PI) + centerX;
    const y2 = radius * Math.sin(angle + Math.PI) + centerY;

    zaglushka1.position({x: x1, y: y1});
    zaglushka2.position({x: x2, y: y2});
}, layer);

anim.start();