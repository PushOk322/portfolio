// @ts-nocheck

export default class EventEmitter {
  constructor() {
    this.collection = {}
  }

  notify(eventType, data) {
    if (!this.collection[eventType]) return

    for (const item of this.collection[eventType]) {
      item(data)
    }
  }

  subscribe(eventType, listener) {
    if (!this.collection[eventType]) {
      this.collection[eventType] = []
    }
    this.collection[eventType].push(listener)
  }

  unsubscribe(eventType, listener) {
    if (!this.collection[eventType]) return

    const index = this.collection[eventType].findIndex((el) => el === listener)
    this.collection[eventType].splice(index, 1)
  }
}
