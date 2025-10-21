const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts={}) {
  console.log('RUN:', cmd);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

const root = process.cwd();
const clientDir = path.join(root, 'client');
if (!fs.existsSync(clientDir)) {
  console.error('client/ directory missing. Run generator or create client first.');
  process.exit(1);
}

// Install deps & build client
run('npm --prefix client install');
run('npm --prefix client run build');

// Copy build to server/public
const buildDir = path.join(clientDir, 'build');
const publicDir = path.join(root, 'public') ; // server will serve from ./public
if (!fs.existsSync(buildDir)) {
  console.error('client/build missing - build failed.');
  process.exit(1);
}

// remove existing public content (safe: only removes ./public)
const rimraf = (p) => {
  if (!fs.existsSync(p)) return;
  const files = fs.readdirSync(p);
  for (const f of files) {
    const fp = path.join(p, f);
    const stat = fs.lstatSync(fp);
    if (stat.isDirectory()) rimraf(fp);
    else fs.unlinkSync(fp);
  }
  fs.rmdirSync(p);
};

// recreate public and copy
if (fs.existsSync(publicDir)) rimraf(publicDir);
fs.mkdirSync(publicDir, { recursive: true });

function copyDir(src, dst) {
  const items = fs.readdirSync(src);
  for (const it of items) {
    const s = path.join(src, it);
    const d = path.join(dst, it);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
copyDir(buildDir, publicDir);
console.log('Copied client/build -> public');
