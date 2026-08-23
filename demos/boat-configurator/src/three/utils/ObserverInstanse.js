import EventEmitter from "./EventEmitter";

export default class ObserverInstance extends EventEmitter {
    constructor(target, options) {
        super()
        this.target = target;
        this.options = options || {
            root: null,
            rootMargin: "0px",
            threshold: 0,
        };
    }

    setObserver() {
        if (!this.target) {
            return;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        const callback = (entries) => {
            const isIntersecting = entries.find((entry) => {
                return entry.isIntersecting;
            });
            if (isIntersecting) {
                this.notify('startAnimation')
            }
            if (!isIntersecting) {
                this.notify('stopAnimation')
            }
        };

        this.observer = new IntersectionObserver(callback, this.options);
        this.observer.observe(this.target);
    }
}
