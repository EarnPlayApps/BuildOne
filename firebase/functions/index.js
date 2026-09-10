const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();
const GITHUB_TOKEN = defineSecret('GITHUB_TOKEN');
const BUILDONE_API_KEY = defineSecret('BUILDONE_API_KEY');
const GH = 'https://api.github.com';

const repoOk = x => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(x || '');
const pkgOk = x => /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/.test(x || '');
const nameSafe = x => String(x || 'BuildOne App').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim().slice(0, 60) || 'BuildOne App';

function ghHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN.value()}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'BuildOne-Firebase'
  };
}

async function gh(url, options = {}) {
  return fetch(url, { ...options, headers: { ...ghHeaders(), ...(options.headers || {}) } });
}

async function putFile(owner, repo, path, content, branch) {
  const url = `${GH}/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const existing = await gh(`${url}?ref=${encodeURIComponent(branch)}`);
  let sha;
  if (existing.ok) sha = (await existing.json()).sha;
  const body = {
    message: `BuildOne Firebase: ${sha ? 'update' : 'create'} ${path}`,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch
  };
  if (sha) body.sha = sha;
  const r = await gh(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`GitHub ${path}: ${r.status} ${await r.text()}`);
  return (await r.json()).commit?.sha || null;
}

function generatedFiles(p) {
  const pkg = p.packageId;
  const app = nameSafe(p.appName);
  const html = String(p.html || '')
    .replace(/<meta[^>]+(minSdkVersion|targetSdkVersion)[^>]*>/gi, '')
    .replace(/<uses-sdk[\s\S]*?<\/uses-sdk>/gi, '');
  const version = String(p.version || '1.0').replace(/[^0-9.]/g, '') || '1.0';
  const javaPath = `app/src/main/java/${pkg.split('.').join('/')}/MainActivity.java`;
  const xmlName = app.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return {
    'settings.gradle': `pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\nrootProject.name='BuildOneGenerated'\ninclude ':app'\n`,
    'build.gradle': `plugins { id 'com.android.application' version '8.6.1' apply false }\n`,
    'gradle.properties': `org.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n`,
    'app/build.gradle': `plugins { id 'com.android.application' }\nandroid { namespace '${pkg}'; compileSdk 35; defaultConfig { applicationId '${pkg}'; minSdk 23; targetSdk 35; versionCode 1; versionName '${version}' }; buildTypes { release { minifyEnabled false; proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),'proguard-rules.pro' } }; compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 } }\n`,
    'app/proguard-rules.pro': '# BuildOne generated rules\n',
    'app/src/main/AndroidManifest.xml': `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:allowBackup="true" android:label="${xmlName}" android:supportsRtl="true" android:theme="@style/AppTheme" android:usesCleartextTraffic="false"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>\n`,
    'app/src/main/res/layout/activity_main.xml': '<?xml version="1.0" encoding="utf-8"?><WebView xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/web" android:layout_width="match_parent" android:layout_height="match_parent"/>\n',
    'app/src/main/res/values/styles.xml': '<resources><style name="AppTheme" parent="android:style/Theme.Material.Light.NoActionBar"><item name="android:fontFamily">sans</item></style></resources>\n',
    'app/src/main/assets/index.html': html,
    [javaPath]: `package ${pkg};\nimport android.app.Activity;import android.os.Bundle;import android.webkit.WebSettings;import android.webkit.WebView;import android.webkit.WebViewClient;\npublic class MainActivity extends Activity { public void onCreate(Bundle b){super.onCreate(b);setContentView(R.layout.activity_main);WebView w=findViewById(R.id.web);w.setWebViewClient(new WebViewClient());WebSettings s=w.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(true);s.setAllowContentAccess(true);w.loadUrl("file:///android_asset/index.html");} }\n`,
    '.buildone/trigger.json': JSON.stringify({ build_type: p.buildType === 'AAB' ? 'AAB' : 'APK', request_id: String(p.requestId || Date.now()), requested_at: new Date().toISOString() }, null, 2) + '\n'
  };
}

async function requireKey(req) {
  const expected = BUILDONE_API_KEY.value();
  if (!expected) throw new Error('BUILDONE_API_KEY is not configured');
  if (req.get('x-buildone-key') !== expected) {
    const e = new Error('Unauthorized'); e.status = 401; throw e;
  }
}

exports.buildoneApi = onRequest({ cors: true, secrets: [GITHUB_TOKEN, BUILDONE_API_KEY], timeoutSeconds: 120 }, async (req, res) => {
  try {
    await requireKey(req);
    const u = new URL(req.url, `https://${req.get('host')}`);
    const token = GITHUB_TOKEN.value();
    if (!token) throw new Error('GITHUB_TOKEN is not configured');

    if (req.method === 'POST' && u.pathname === '/build') {
      const p = req.body || {};
      const parts = String(p.repo || '').split('/');
      if (!repoOk(p.repo) || !pkgOk(p.packageId)) {
        res.status(400).json({ ok: false, error: 'Invalid repository or package ID' }); return;
      }
      const [owner, repo] = parts;
      const branch = p.branch || 'main';
      const requestId = `BO-${Date.now()}`;
      const files = generatedFiles({ ...p, requestId });
      let triggerSha = null;
      for (const [path, content] of Object.entries(files)) {
        const sha = await putFile(owner, repo, path, content, branch);
        if (path === '.buildone/trigger.json') triggerSha = sha;
      }
      await db.collection('builds').doc(requestId).set({
        requestId, owner, repo, branch, packageId: p.packageId,
        appName: nameSafe(p.appName), buildType: p.buildType === 'AAB' ? 'AAB' : 'APK',
        status: 'QUEUED', triggerSha, createdAt: FieldValue.serverTimestamp()
      });
      res.status(202).json({ ok: true, id: requestId, owner, repo, branch, type: p.buildType === 'AAB' ? 'AAB' : 'APK', triggerSha, trigger: 'push' }); return;
    }

    if (req.method === 'GET' && u.pathname === '/status') {
      const owner = u.searchParams.get('owner');
      const repo = u.searchParams.get('repo');
      const id = u.searchParams.get('run_id');
      if (!owner || !repo) throw new Error('owner and repo required');
      let run = null;
      if (id) {
        const x = await gh(`${GH}/repos/${owner}/${repo}/actions/runs/${encodeURIComponent(id)}`);
        if (x.ok) run = await x.json();
      }
      if (!run) {
        const x = await gh(`${GH}/repos/${owner}/${repo}/actions/runs?event=push&per_page=20`);
        if (!x.ok) throw new Error(`runs failed: ${x.status}`);
        const d = await x.json();
        run = d.workflow_runs?.find(x => x.path?.endsWith('/buildone.yml')) || null;
      }
      let artifacts = [];
      if (run?.id) {
        const x = await gh(`${GH}/repos/${owner}/${repo}/actions/runs/${run.id}/artifacts`);
        if (x.ok) artifacts = (await x.json()).artifacts || [];
      }
      if (id) {
        const ref = db.collection('builds').where('requestId', '==', String(id)).limit(1);
        const snap = await ref.get();
        if (!snap.empty) await snap.docs[0].ref.update({ status: run?.conclusion === 'success' ? 'VERIFIED' : run?.status === 'completed' ? 'FAILED' : 'BUILDING', runId: run?.id || null, sha: run?.head_sha || null, updatedAt: FieldValue.serverTimestamp() });
      }
      res.json({ ok: true, run: run && { id: run.id, status: run.status, conclusion: run.conclusion, sha: run.head_sha, url: run.html_url }, artifacts: artifacts.map(a => ({ id: a.id, name: a.name, size: a.size_in_bytes, expired: a.expired })) }); return;
    }

    if (req.method === 'GET' && u.pathname === '/artifact') {
      const owner = u.searchParams.get('owner'), repo = u.searchParams.get('repo'), id = u.searchParams.get('artifact_id');
      if (!owner || !repo || !id) throw new Error('artifact parameters required');
      const meta = await gh(`${GH}/repos/${owner}/${repo}/actions/artifacts/${id}`);
      if (!meta.ok) throw new Error(`artifact verification failed: ${meta.status}`);
      const m = await meta.json();
      if (m.expired || !m.size_in_bytes) throw new Error('Artifact is missing, expired, or empty');
      const x = await gh(`${GH}/repos/${owner}/${repo}/actions/artifacts/${id}/zip`);
      if (!x.ok) throw new Error(`artifact download failed: ${x.status}`);
      const buf = Buffer.from(await x.arrayBuffer());
      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', 'attachment; filename="buildone-artifact.zip"');
      res.set('Content-Length', String(buf.length));
      res.status(200).send(buf); return;
    }

    if (req.method === 'GET' && u.pathname === '/health') {
      res.json({ ok: true, service: 'BuildOne Firebase', firebase: true, github: !!token }); return;
    }
    res.json({ ok: true, service: 'BuildOne Firebase API' });
  } catch (e) {
    res.status(e.status || 400).json({ ok: false, error: e.message || String(e) });
  }
});
