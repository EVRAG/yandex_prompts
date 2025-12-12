function randomNickname() {
  return `load-${Math.random().toString(16).slice(2, 8)}`;
}

module.exports = {
  beforeScenario: (context, events, done) => {
    context.vars.nickname = randomNickname();
    return done();
  },
};



