const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../models/all-MiniLM-L6-v2');
const onnxDir = path.join(targetDir, 'onnx');

fs.mkdirSync(onnxDir, { recursive: true });

const files = [
  { url: 'https://raw.githubusercontent.com/Xyntopia/all-MiniLM-L6-v2/main/config.json', dest: path.join(targetDir, 'config.json') },
  { url: 'https://raw.githubusercontent.com/Xyntopia/all-MiniLM-L6-v2/main/tokenizer.json', dest: path.join(targetDir, 'tokenizer.json') },
  { url: 'https://raw.githubusercontent.com/Xyntopia/all-MiniLM-L6-v2/main/tokenizer_config.json', dest: path.join(targetDir, 'tokenizer_config.json') },
  { url: 'https://raw.githubusercontent.com/Xyntopia/all-MiniLM-L6-v2/main/special_tokens_map.json', dest: path.join(targetDir, 'special_tokens_map.json') },
  { url: 'https://raw.githubusercontent.com/Xyntopia/all-MiniLM-L6-v2/main/vocab.txt', dest: path.join(targetDir, 'vocab.txt') },
  { url: 'https://media.githubusercontent.com/media/Xyntopia/all-MiniLM-L6-v2/main/onnx/model_quantized.onnx', dest: path.join(onnxDir, 'model_quantized.onnx') },
  { url: 'https://media.githubusercontent.com/media/Xyntopia/all-MiniLM-L6-v2/main/onnx/model.onnx', dest: path.join(onnxDir, 'model.onnx') }
];

(async () => {
  for (const item of files) {
    if (fs.existsSync(item.dest)) {
      console.log('Model file already cached:', path.basename(item.dest));
      continue;
    }
    console.log('Downloading model asset:', path.basename(item.dest), 'from', item.url);
    const resp = await fetch(item.url);
    if (!resp.ok) throw new Error('Failed to fetch ' + item.url + ': ' + resp.status);
    const buffer = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(item.dest, buffer);
    console.log('Saved:', path.basename(item.dest), '(' + buffer.length + ' bytes)');
  }
  console.log('all-MiniLM-L6-v2 ONNX model is fully ready for local inference.');
})().catch(err => {
  console.error('Model download error:', err);
  process.exit(1);
});
