export class Utils {
	static hasClass(el: HTMLElement | Element, className: string): boolean {
		return el.classList.contains(className);
	}

	static removeClass(el: HTMLElement | Element, className: string): void {
		el.classList.remove(className);
	}

	static addClass(el: HTMLElement | Element, className: string): void {
		el.classList.add(className);
	}

	static getClasses(el: HTMLElement | Element): string[] {
		return Array.from(el.classList);
	}

	static toggleClass(el: HTMLElement | Element, className: string): void {
		if (!el) return;

		if (el.classList.contains(className)) {
			el.classList.remove(className);
		} else {
			el.classList.add(className);
		}
	}

	static addZero(seconds: number): string {
		return seconds < 10 ? `0${seconds}` : `${seconds}`;
	}
}
