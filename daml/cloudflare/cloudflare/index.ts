// Entry worker — exposes HTTP endpoint to trigger the workflow

export { ProcClientWorkflow } from './workflow';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'POST') {
      const params = await req.json();
      const instance = await env.WORKFLOW.create({ params });
      return Response.json({ id: instance.id, status: 'started' });
    }
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (!id) return Response.json({ error: 'Missing workflow id' }, { status: 400 });
      const instance = await env.WORKFLOW.get(id);
      const status = await instance.status();
      return Response.json(status);
    }
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  },
};

interface Env {
  WORKFLOW: Workflow;
  CANTON_LEDGER_API: string;
  CANTON_AUTH_TOKEN: string;
}