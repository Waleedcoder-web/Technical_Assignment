const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.resolve(__dirname, '../models/Qwen2.5-0.5B-Instruct');
const onnxDir = path.join(targetDir, 'onnx');

fs.mkdirSync(onnxDir, { recursive: true });

const BASE_URL = 'https://www.modelscope.cn/api/v1/models/onnx-community/Qwen2.5-0.5B-Instruct/repo?Revision=master&FilePath=';

const files = [
  { name: 'config.json', path: 'config.json', dest: path.join(targetDir, 'config.json') },
  { name: 'generation_config.json', path: 'generation_config.json', dest: path.join(targetDir, 'generation_config.json') },
  { name: 'tokenizer.json', path: 'tokenizer.json', dest: path.join(targetDir, 'tokenizer.json') },
  { name: 'tokenizer_config.json', path: 'tokenizer_config.json', dest: path.join(targetDir, 'tokenizer_config.json') },
  { name: 'special_tokens_map.json', path: 'special_tokens_map.json', dest: path.join(targetDir, 'special_tokens_map.json') },
  { name: 'vocab.json', path: 'vocab.json', dest: path.join(targetDir, 'vocab.json') },
  { name: 'merges.txt', path: 'merges.txt', dest: path.join(targetDir, 'merges.txt') },
  { name: 'added_tokens.json', path: 'added_tokens.json', dest: path.join(targetDir, 'added_tokens.json') },
  { name: 'onnx/model_q4.onnx', path: 'onnx/model_q4.onnx', dest: path.join(onnxDir, 'model_q4.onnx'), expectedMinBytes: 700 * 1024 * 1024 }
];

async function downloadFileWithRetry(url, dest, expectedMinBytes = 0, maxRetries = 5) {
  if (fs.existsSync(dest)) {
    const stat = fs.statSync(dest);
    if (expectedMinBytes === 0 || stat.size >= expectedMinBytes) {
      console.log(`[Cache OK] ${path.basename(dest)} already present (${(stat.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
  }

  // Use curl with resume for large onnx files
  if (dest.endsWith('.onnx')) {
    const { execSync } = require('child_process');
    console.log(`[Resumable Download] ${path.basename(dest)} using curl...`);
    const cmd = `curl.exe -L -C - --retry 10 --retry-delay 2 --retry-max-time 1800 -o "${dest}" "${url}"`;
    while (true) {
      const currentBytes = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      if (currentBytes >= expectedMinBytes) break;
      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch (e) {
        const afterBytes = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
        console.log(`[Resume Loop] Connection reset. Re-running curl from ${(afterBytes / 1024 / 1024).toFixed(1)} MB...`);
      }
    }
    const stat = fs.statSync(dest);
    console.log(`[Saved] ${path.basename(dest)} (${(stat.size / 1024 / 1024).toFixed(1)} MB) successfully.`);
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Download] ${path.basename(dest)} (Attempt ${attempt}/${maxRetries})...`);
      const tempDest = dest + '.tmp';
      if (fs.existsSync(tempDest)) fs.unlinkSync(tempDest);

      const resp = await fetch(url, { headers: { 'User-Agent': 'HavenKey-Local-LLM-Installer' } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);

      const totalBytes = Number(resp.headers.get('content-length')) || 0;
      const fileStream = fs.createWriteStream(tempDest);

      let downloadedBytes = 0;
      let lastReport = Date.now();

      for await (const chunk of resp.body) {
        fileStream.write(chunk);
        downloadedBytes += chunk.length;
        if (Date.now() - lastReport > 2000) {
          const mb = (downloadedBytes / 1024 / 1024).toFixed(1);
          const totalMb = totalBytes ? (totalBytes / 1024 / 1024).toFixed(1) : '?';
          process.stdout.write(` -> Progress: ${mb} MB / ${totalMb} MB\r`);
          lastReport = Date.now();
        }
      }

      await new Promise((res, rej) => {
        fileStream.end((err) => (err ? rej(err) : res()));
      });

      fs.renameSync(tempDest, dest);
      const finalStat = fs.statSync(dest);
      console.log(`\n[Saved] ${path.basename(dest)} (${(finalStat.size / 1024 / 1024).toFixed(1)} MB) successfully.`);
      return;
    } catch (err) {
      console.error(`\n[Error] Attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        const backoff = 2000 * attempt;
        console.log(`Waiting ${backoff / 1000}s before retrying...`);
        await new Promise((r) => setTimeout(r, backoff));
      } else {
        throw err;
      }
    }
  }
}

(async () => {
  console.log('=== HavenKey Local LLM Downloader (Qwen2.5-0.5B-Instruct ONNX Q4) ===');
  console.log('Target directory:', targetDir);

  for (const item of files) {
    const fileUrl = BASE_URL + encodeURIComponent(item.path);
    await downloadFileWithRetry(fileUrl, item.dest, item.expectedMinBytes || 0);
  }

  console.log('\n=== All Qwen2.5-0.5B-Instruct ONNX Q4 model files are locally cached and ready! ===');
})().catch((err) => {
  console.error('\nFatal download error:', err);
  process.exit(1);
});
