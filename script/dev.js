const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs/promises');
const chokidar = require('chokidar');

const minimist = require('minimist');
const args = minimist(process.argv.slice(2));

const ProjectRoot = path.join(__dirname, '..');
const distRoot = path.join(ProjectRoot, 'dist');
const SourceCodeRoot = path.join(ProjectRoot, 'src');
const getManifest = require('./get-manifest');

let nextBuild = null;
let buildIng = false;

async function build() {
  buildIng = true;
  await fs.rm(distRoot, { recursive: true, force: true });
  await fs.mkdir(distRoot, { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(SourceCodeRoot, 'beancount-plugin.ts')],
    outfile: path.join(distRoot, 'main.js'),
    bundle: true,
    external: ['obsidian', 'fs', 'path'],
    format: 'cjs',
  });
  await fs.writeFile(
    path.join(distRoot, 'manifest.json'),
    JSON.stringify(getManifest(), null, 2)
  );
  if (args.obsidian) {
    const pluginRoot = path.resolve(
      args.obsidian,
      '.obsidian/plugins/' + getManifest().id
    );

    console.log('Copy Dist to :', pluginRoot);
    await fs.rm(pluginRoot, { recursive: true, force: true });
    await fs.mkdir(pluginRoot, { recursive: true });
    await fs.cp(distRoot, pluginRoot, { recursive: true });
  }

  buildIng = false;
  if (nextBuild) {
    nextBuild();
    nextBuild = null;
  }
}

chokidar.watch(SourceCodeRoot).on('all', () => {
  if (buildIng) {
    nextBuild = build;
  } else {
    build();
  }
});
