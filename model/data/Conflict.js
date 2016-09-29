class Conflict extends Error {
  constructor(a, b) {
    super("Conflict: " + JSON.stringify(a) +" vs " + JSON.stringify(b))
    this.a = a;
    this.b = b;
  }
}

export default Conflict;
