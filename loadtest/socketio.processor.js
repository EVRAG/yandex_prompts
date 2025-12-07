function randomNickname() {
  return `load-${Math.random().toString(16).slice(2, 8)}`;
}

module.exports = {
  beforeScenario: (context, events, done) => {
    context.vars.stageId = process.env.STAGE_ID || 'question_1';
    context.vars.nickname = randomNickname();
    return done();
  },
};
