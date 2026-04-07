// Camunda External Task Worker for Canton/Daml Orchestration
// Handles "canton-exercise" topics by calling the Canton JSON API

const { Client, logger } = require('camunda-external-task-client-js');

const CANTON_LEDGER_API = process.env.CANTON_LEDGER_API || 'http://localhost:7575';
const CANTON_PARTY_TOKEN = process.env.CANTON_PARTY_TOKEN || '';

const client = new Client({
  baseUrl: process.env.CAMUNDA_URL || 'http://localhost:8080/engine-rest',
  use: logger,
});

async function exerciseChoice(templateId, contractId, choiceName, args, party) {
  const response = await fetch(`${CANTON_LEDGER_API}/v1/exercise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CANTON_PARTY_TOKEN}`,
    },
    body: JSON.stringify({
      templateId: `Main:${templateId}`,
      contractId,
      choice: choiceName,
      argument: args,
      meta: { actAs: [party] },
    }),
  });
  if (!response.ok) throw new Error(`Canton API error: ${response.status}`);
  return response.json();
}

client.subscribe('canton-exercise', async ({ task, taskService }) => {
  try {
    const damlChoice = task.variables.get('damlChoice');
    const damlTemplate = task.variables.get('damlTemplate');
    const controller = task.variables.get('controller');
    const contractId = task.variables.get('contractId');

    console.log(`Exercising ${damlChoice} on ${damlTemplate} as ${controller}`);

    const result = await exerciseChoice(damlTemplate, contractId, damlChoice, {}, controller);

    await taskService.complete(task, {
      contractId: result.exerciseResult,
      lastChoice: damlChoice,
    });
  } catch (err) {
    console.error('Canton exercise failed:', err.message);
    await taskService.handleFailure(task, {
      errorMessage: err.message,
      errorDetails: err.stack,
      retries: task.retries - 1,
      retryTimeout: 5000,
    });
  }
});

console.log('Canton-Camunda worker listening on topic: canton-exercise');