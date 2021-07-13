export default session => ({
  getState() {
    return session.call("parflow.state.get", []);
  },
  saveSimputView(view) {
    return session.call("parflow.simput.save", [view]);
  },
  runParflow() {
    return session.call("parflow.simput.run", []);
  }
});
