import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT   = join(dirname(fileURLToPath(import.meta.url)), '..');
const app    = express();
const client = new Anthropic();

app.use(express.json());
app.use(express.static(join(ROOT, 'public')));

const accountData = readFileSync(join(ROOT, 'data/customer-account.json'), 'utf-8');

function loadPrompt(filename: string): string {
  return readFileSync(join(ROOT, 'prompts', filename), 'utf-8')
    .replace('{{account_data}}', accountData);
}

app.get('/api/data', (_req, res) => {
  res.json({
    prompts: {
      broken: readFileSync(join(ROOT, 'prompts/support-agent-v0-broken.xml'), 'utf-8'),
      fixed:  readFileSync(join(ROOT, 'prompts/support-agent-v1-fixed.xml'), 'utf-8'),
      messy:  readFileSync(join(ROOT, 'prompts/messy-prompt-v0.txt'), 'utf-8'),
      clean:  readFileSync(join(ROOT, 'prompts/clean-prompt-v1.xml'), 'utf-8'),
    },
    patchLog: JSON.parse(readFileSync(join(ROOT, 'patch-log.json'), 'utf-8')),
  });
});

app.post('/api/stream', async (req, res) => {
  const { demo, message } = req.body as { demo: number; message: string };

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  function send(data: object) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  const [leftFile, rightFile] = demo === 1
    ? ['support-agent-v0-broken.xml', 'support-agent-v1-fixed.xml']
    : ['messy-prompt-v0.txt',         'clean-prompt-v1.xml'];

  async function streamSide(side: 'left' | 'right', file: string) {
    try {
      const stream = client.messages.stream({
        model:       'claude-opus-4-8',
        max_tokens:  250,
        system:      loadPrompt(file),
        messages:    [{ role: 'user', content: message }],
      });
      stream.on('text', (text: string) => send({ side, text }));
      await stream.finalMessage();
      send({ side, done: true });
    } catch (err) {
      send({ side, error: String(err), done: true });
    }
  }

  await Promise.all([
    streamSide('left',  leftFile),
    streamSide('right', rightFile),
  ]);

  res.end();
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`\n  Prompt Engineering Demo UI`);
  console.log(`  http://localhost:${PORT}\n`);
});
