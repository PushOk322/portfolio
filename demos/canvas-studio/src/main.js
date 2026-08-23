import { gsap } from "gsap";

const wrapper = document.querySelector(".image__wrapper");
const image = document.querySelector(".image");

let isHovering = false;
let mouseMoveEnabled = false;
let delayTimeout;

wrapper.addEventListener("mouseenter", () => {
	isHovering = true;

	gsap.to(image, {
		scale: 0.8,
		rotateX: 0,
		rotateY: 0,
		duration: 0.2,
		ease: "power2.out",
	});

	delayTimeout = setTimeout(() => {
		mouseMoveEnabled = true;
	}, 200);
});

wrapper.addEventListener("mousemove", (e) => {
	if (!mouseMoveEnabled) return;

	const rect = wrapper.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	const centerX = rect.width / 2;
	const centerY = rect.height / 2;

	const rotateX = -(y - centerY) / 20;
	const rotateY = (x - centerX) / 20;

	gsap.to(image, {
		rotateX,
		rotateY,
		duration: 0.1,
		ease: "power1.out",
	});

	// gsap.to(image, {
	// 	translateX: rotateY * 5,
	// 	translateY: -rotateX * 5,
	// 	duration: 0.1,
	// 	ease: "power1.out",
	// });

	//   gsap.to(image, {
	// 		scewX: rotateX ,
	// 		scewY: rotateY,
	// 		duration: 0.1,
	// 		ease: "power1.out",
	//   });
});

wrapper.addEventListener("mouseleave", () => {
	isHovering = false;
	mouseMoveEnabled = false;
	clearTimeout(delayTimeout);

	gsap.to(image, {
		scale: 1,
		rotateX: 0,
		rotateY: 0,
		duration: 0.3,
		ease: "power2.inOut",
	});
});

const floatAnim = gsap.fromTo(
	".floating",
	{ top: "250px" },
	{
		top: "400px",
		duration: 2,
		repeat: -1,
		yoyo: true,
		ease: "power1.inOut",
	}
);

const floater = document.querySelector(".floating");

floater.addEventListener("mouseenter", () => {
	floatAnim.pause();
	gsap.to(floater, {
		rotate: 0,
		duration: 0.3,
		ease: "power2.out",
		cursor: "pointer",
	});
});

floater.addEventListener("mouseleave", () => {
	gsap.to(floater, {
		rotate: 30,
		duration: 0.3,
		ease: "power2.inOut",
		onComplete: () => floatAnim.resume(),
	});
});

const button = document.querySelector(".button");
const line = button.querySelector(".line");
const ring = button.querySelector(".ring circle");

const tl = gsap.timeline({ paused: true });

tl.to(line, {
	width: 0,
	translateX: "-30px",
	duration: 0.3,
	ease: "power2.out",
}).to(
	ring,
	{
		strokeDashoffset: 0,
		duration: 0.5,
		ease: "power2.out",
	},
	"<"
);

button.addEventListener("mouseenter", () => {
	tl.play();
});

button.addEventListener("mouseleave", () => {
	tl.reverse();
});
