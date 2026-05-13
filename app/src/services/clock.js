class LamportClock {
  constructor() { this.t = 0; }
  tick() { return ++this.t; }
  update(received) {
    this.t = Math.max(this.t, received) + 1;
    return this.t;
  }
}
const clock = new LamportClock();
module.exports = clock;
