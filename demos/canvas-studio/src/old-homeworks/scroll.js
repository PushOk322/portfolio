import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
	scrollTrigger: {
		trigger: ".scene",
		start: "top top",
		end: "3000px",
		scrub: 1,
		pin: true,
		markers: true,
	},
});
tl.to(".phone-1", {
	rotate: 15,
	x: 700,
	rotateY: 30,
	scale: 1.1,
	duration: 0.7,
	ease: "power2.out",
})
	.to(".phone-1", {
		rotate: 0,
		x: 800,
		rotateY: 0,
		scale: 1,
		duration: 0.1,
		ease: "power2.inOut",
	})

	.set(".phone-2", {
		visibility: "visible",
		x: 800,
		rotate: 0,
		rotateY: 0,
		scale: 0.9,
	})
	.set(".phone-1", { visibility: "hidden" })
	.to(".phone-2", {
		rotateY: -180,
		x: 400,
		scale: 1.05,
		duration: 0.7,
		ease: "power2.out",
	})
	.to(".phone-2", {
		rotateY: 0,
		x: 0,
		scale: 1,
		duration: 0.5,
		ease: "power2.inOut",
	})

	.set(".phone-3", {
		visibility: "visible",
		x: 0,
		rotate: 0,
		scale: 0.8,
		opacity: 0,
	})
	.set(".phone-2", { visibility: "hidden" })
	.to(".phone-3", {
		opacity: 1,
		rotate: -360,
		scale: 1.1,
		duration: 0.5,
		ease: "back.out(1.7)",
	})
	.to(".phone-3", {
		x: 800,
		rotate: 0,
		scale: 1,
		duration: 0.7,
		ease: "power2.inOut",
	})
	.to(".phone-3", {
		x: 400,
		rotate: 0,
		scale: 1,
		duration: 0.7,
		ease: "power2.inOut",
	});
