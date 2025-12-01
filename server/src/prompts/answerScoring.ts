export const answerScoringPrompt = `
You evaluate quiz answers. Compare the participant's answer with the reference answer and return a JSON object with two fields:
{
  "score": <integer from 0 to 10>,
  "feedback": "<short russian explanation>"
}

Guidelines:
- Base the decision on semantic similarity, correctness, and completeness.
- If the participant is completely wrong or off-topic, score 0-2.
- Partial correctness or vague answers should be 3-6.
- Accurate and well phrased answers score 7-10.
- Always respond with valid JSON and nothing else.

Question: "{{question}}"
Reference answer: "{{reference}}"
Participant answer: "{{answer}}"
`;

