const GH='https://api.github.com';
const C={'access-control-allow-origin':'*','access-control-allow-headers':'content-type,x-buildone-key','access-control-allow-methods':'GET,POST,OPTIONS'};
const ADS={app:'ca-app-pub-9940728659432865~7416412396',banner:'ca-app-pub-9940728659432865/5564274675',interstitial:'ca-app-pub-9940728659432865/4251193002'};
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'content-type':'application/json;charset=utf-8'}});
const headers=t=>({Authorization:`Bearer ${t}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'BuildOne-Worker','Content-Type':'application/json'});
const repoOk=x=>/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(x||'');
const pkgOk=x=>/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/.test(x||'');
const adAppOk=x=>/^ca-app-pub-\d{16}~\d{10}$/.test(x||'');
const adUnitOk=x=>/^ca-app-pub-\d{16}\/\d{10}$/.test(x||'');
const pubOk=x=>/^pub-\d{16}$/.test(x||'');
const domainOk=x=>/^(?=.{1,253}$)(?!-)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(x||'')&&!/[\s/]/.test(x||'');
const privateHost=x=>/^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|169\.254(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})$/i.test(x||'');
async function gh(url,t,opt={}){return fetch(url,{...opt,headers:{...headers(t),...(opt.headers||{})}})}
async function put(repo,path,content,branch,t){const [o,r]=repo.split('/'),u=`${GH}/repos/${o}/${r}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;let sha=null;const q=await gh(`${u}?ref=${encodeURIComponent(branch)}`,t);if(q.ok)sha=(await q.json()).sha;const body={message:`BuildOne: ${sha?'update':'create'} ${path}`,content:btoa(unescape(encodeURIComponent(content))),branch};if(sha)body.sha=sha;const x=await gh(u,t,{method:'PUT',body:JSON.stringify(body)});if(!x.ok)throw Error(`GitHub ${path}: ${x.status}`);return (await x.json()).commit?.sha||null}
async function logDb(env,build){if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return;try{await fetch(`${env.SUPABASE_URL}/rest/v1/builds`,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify(build)})}catch(_){} }
function workflow(){return `name: BuildOne Real Android Build
on:
  push:
    branches: [main]
    paths: ['.buildone/trigger.json']
  workflow_dispatch:
    inputs:
      build_type:
        required: true
        default: APK
        type: choice
        options: [APK, AAB]
permissions:
  contents: read
concurrency:
  group: buildone-\${{ github.ref }}
  cancel-in-progress: false
jobs:
  build:
    name: BuildOne Real Build
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
          cache: gradle
      - name: Read BuildOne request
        id: request
        shell: bash
        run: |
          set -euo pipefail
          test -s .buildone/trigger.json
          TYPE=$(python3 -c "import json; print(json.load(open('.buildone/trigger.json'))['build_type'])")
          SIGN=$(python3 -c "import json; print(json.load(open('.buildone/trigger.json')).get('signing_mode','unsigned'))")
          BUILD_ID=$(python3 -c "import json; print(json.load(open('.buildone/trigger.json'))['build_id'])")
          case "$TYPE" in APK|AAB) ;; *) exit 1;; esac
          case "$SIGN" in unsigned|signed) ;; *) exit 1;; esac
          echo "type=$TYPE" >> "$GITHUB_OUTPUT"
          echo "sign=$SIGN" >> "$GITHUB_OUTPUT"
          echo "build_id=$BUILD_ID" >> "$GITHUB_OUTPUT"
      - name: Install compatible Gradle 8.7
        run: |
          set -euo pipefail
          curl -fsSL https://services.gradle.org/distributions/gradle-8.7-bin.zip -o /tmp/gradle.zip
          unzip -q /tmp/gradle.zip -d /tmp
          echo "/tmp/gradle-8.7/bin" >> "$GITHUB_PATH"
          gradle --version
      - name: Build Gate
        shell: bash
        run: |
          set -euo pipefail
          test -f settings.gradle && test -f build.gradle && test -f gradle.properties
          test -f app/build.gradle && test -f app/src/main/AndroidManifest.xml
          test -s app/src/main/assets/index.html
          grep -q "play-services-ads:25.4.0" app/build.gradle
          grep -q "com.google.android.gms.ads.APPLICATION_ID" app/src/main/AndroidManifest.xml
          grep -q "ca-app-pub-9940728659432865~7416412396" app/src/main/AndroidManifest.xml
          if grep -Eqi '<uses-sdk|targetSdkVersion|minSdkVersion' app/src/main/assets/index.html; then echo "SDK metadata leaked"; exit 1; fi
          python3 - <<'PY'
          import re
          p=open('app/build.gradle').read()
          for key,minimum in [('compileSdk',35),('minSdk',23),('targetSdk',35)]:
              m=re.search(r'\b'+key+r'\s+(\d+)',p)
              assert m and int(m.group(1))>=minimum, key+' compatibility gate failed'
          print('BuildOne compatibility gate PASS')
          PY
      - name: Prepare release signing
        if: steps.request.outputs.sign == 'signed'
        env:
          KS: \${{ secrets.BUILDONE_KEYSTORE_BASE64 }}
          KP: \${{ secrets.BUILDONE_KEYSTORE_PASSWORD }}
          KA: \${{ secrets.BUILDONE_KEY_ALIAS }}
          KPP: \${{ secrets.BUILDONE_KEY_PASSWORD }}
        run: |
          set -euo pipefail
          test -n "$KS" && test -n "$KP" && test -n "$KA" && test -n "$KPP"
          printf '%s' "$KS" | base64 --decode > app/buildone-release.keystore
          python3 - <<'PY'
          p=open('app/build.gradle').read()
          old="buildTypes { release { minifyEnabled false;"
          new="signingConfigs { release { storeFile file('buildone-release.keystore'); storePassword System.getenv('BUILDONE_KEYSTORE_PASSWORD'); keyAlias System.getenv('BUILDONE_KEY_ALIAS'); keyPassword System.getenv('BUILDONE_KEY_PASSWORD') } } buildTypes { release { signingConfig signingConfigs.release; minifyEnabled false;"
          assert old in p
          open('app/build.gradle','w').write(p.replace(old,new,1))
          PY
      - name: Real Gradle build
        env:
          BUILDONE_KEYSTORE_PASSWORD: \${{ secrets.BUILDONE_KEYSTORE_PASSWORD }}
          BUILDONE_KEY_ALIAS: \${{ secrets.BUILDONE_KEY_ALIAS }}
          BUILDONE_KEY_PASSWORD: \${{ secrets.BUILDONE_KEY_PASSWORD }}
        run: |
          set -euo pipefail
          if [ "\${{ steps.request.outputs.type }}" = "AAB" ]; then gradle bundleRelease --no-daemon --stacktrace; else gradle assembleRelease --no-daemon --stacktrace; fi
      - name: Artifact Verification
        shell: bash
        run: |
          set -euo pipefail
          TYPE="\${{ steps.request.outputs.type }}"
          ID="\${{ steps.request.outputs.build_id }}"
          if [ "$TYPE" = "AAB" ]; then FILE=$(find app/build/outputs/bundle -type f -name '*.aab' -print -quit); else FILE=$(find app/build/outputs/apk -type f -name '*.apk' -print -quit); fi
          test -n "$FILE" && test -f "$FILE" && test -s "$FILE"
          case "$FILE" in *.aab) [ "$TYPE" = AAB ];; *.apk) [ "$TYPE" = APK ];; *) exit 1;; esac
          SHA=$(sha256sum "$FILE" | awk '{print $1}')
          SIZE=$(stat -c%s "$FILE")
          test "$SIZE" -gt 0
          printf '%s  %s\\n' "$SHA" "$FILE" > artifact.sha256
          python3 - <<PY
          import json
          data={'build_id':'$ID','type':'$TYPE','size':$SIZE,'sha256':'$SHA','commit':'\${{ github.sha }}','workflow':'\${{ github.workflow }}','run_number':\${{ github.run_number }},'run_id':\${{ github.run_id }},'artifact_file':'$FILE'}
          open('buildone-artifact.json','w').write(json.dumps(data,indent=2)+'\\n')
          print(json.dumps(data,indent=2))
          PY
      - name: Remove signing material
        if: always()
        run: rm -f app/buildone-release.keystore
      - uses: actions/upload-artifact@v4
        with:
          name: buildone-\${{ steps.request.outputs.type }}-\${{ github.run_id }}
          path: |
            app/build/outputs/apk/**/*.apk
            app/build/outputs/bundle/**/*.aab
            artifact.sha256
            buildone-artifact.json
          if-no-files-found: error
          retention-days: 90
`;}
function generated(p){const pkg=p.packageId,app=String(p.appName||'BuildOne App').replace(/[<>:"/\\|?*\x00-\x1F]/g,'').trim().slice(0,60)||'BuildOne App';const html=String(p.html||'').replace(/<uses-sdk[\s\S]*?<\/uses-sdk>/gi,'').replace(/<meta[^>]+(minSdkVersion|targetSdkVersion)[^>]*>/gi,'');const a=p.admob||{},appId=a.appId||ADS.app,banner=a.banner||ADS.banner,interstitial=a.interstitial||ADS.interstitial;if(!pkgOk(pkg)||!adAppOk(appId)||!adUnitOk(banner)||!adUnitOk(interstitial))throw Error('Invalid BuildOne project or AdMob configuration');const version=String(p.version||'1.0').replace(/[^0-9.]/g,'')||'1.0',jp=`app/src/main/java/${pkg.split('.').join('/')}/MainActivity.java`;return {'settings.gradle':`pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\nrootProject.name='BuildOneGenerated'\ninclude ':app'\n`,'build.gradle':`plugins { id 'com.android.application' version '8.6.1' apply false }\n`,'gradle.properties':`org.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n`,'app/build.gradle':`plugins { id 'com.android.application' }\nandroid { namespace '${pkg}'; compileSdk 35; defaultConfig { applicationId '${pkg}'; minSdk 23; targetSdk 35; versionCode 1; versionName '${version}' }; buildTypes { release { minifyEnabled false; proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),'proguard-rules.pro' } }; compileOptions { sourceCompatibility JavaVersion.VERSION_17; targetCompatibility JavaVersion.VERSION_17 } }\ndependencies { implementation 'com.google.android.gms:play-services-ads:25.4.0' }\n`,'app/proguard-rules.pro':'# BuildOne generated rules\n','app/src/main/AndroidManifest.xml':`<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.INTERNET"/><application android:allowBackup="true" android:label="${app.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" android:supportsRtl="true" android:hardwareAccelerated="true" android:usesCleartextTraffic="false" android:theme="@style/AppTheme"><meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${appId}"/><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>\n`,'app/src/main/res/layout/activity_main.xml':'<?xml version="1.0" encoding="utf-8"?><LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical"><WebView android:id="@+id/web" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1"/><FrameLayout android:id="@+id/ad_container" android:layout_width="match_parent" android:layout_height="wrap_content"/></LinearLayout>\n','app/src/main/res/values/styles.xml':'<resources><style name="AppTheme" parent="android:style/Theme.Material.Light.NoActionBar"/></resources>\n','app/src/main/assets/index.html':html,[jp]:`package ${pkg};\nimport android.app.Activity;import android.os.Bundle;import android.view.ViewGroup;import android.webkit.WebSettings;import android.webkit.WebView;import android.webkit.WebViewClient;import com.google.android.gms.ads.*;import com.google.android.gms.ads.interstitial.*;\npublic class MainActivity extends Activity{private static final String B="${banner}";private static final String I="${interstitial}";private InterstitialAd interstitial;public void onCreate(Bundle b){super.onCreate(b);setContentView(R.layout.activity_main);WebView w=findViewById(R.id.web);w.setWebViewClient(new WebViewClient());WebSettings s=w.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);w.loadUrl("file:///android_asset/index.html");MobileAds.initialize(this,x->{});AdView ad=new AdView(this);ad.setAdUnitId(B);ad.setAdSize(AdSize.getLargeAnchoredAdaptiveBannerAdSize(this,360));((ViewGroup)findViewById(R.id.ad_container)).addView(ad);ad.loadAd(new AdRequest.Builder().build());loadInterstitial();}private void loadInterstitial(){InterstitialAd.load(this,I,new AdRequest.Builder().build(),new InterstitialAdLoadCallback(){public void onAdLoaded(InterstitialAd a){interstitial=a;}public void onAdFailedToLoad(LoadAdError e){interstitial=null;}});}public void showInterstitial(){if(interstitial!=null){interstitial.show(this);interstitial=null;loadInterstitial();}}}\n`,'.buildone/trigger.json':JSON.stringify({build_id:String(p.requestId||'buildone-'+Date.now()),build_type:p.buildType==='AAB'?'AAB':'APK',signing_mode:p.signingMode==='signed'?'signed':'unsigned',requested_at:new Date().toISOString()},null,2)+'\n'} }
async function build(req,env){const p=await req.json(),repo=String(p.repo||''),branch=p.branch||'main';if(repo!=='EarnPlayApps/BuildOne'||!repoOk(repo)||!pkgOk(p.packageId))throw Error('BuildOne repository/package is invalid');const buildId=String(p.requestId||'buildone-'+Date.now()),type=p.buildType==='AAB'?'AAB':'APK',f=generated({...p,requestId:buildId,buildType:type});let triggerSha=null;for(const path of Object.keys(f)){const s=await put(repo,path,f[path],branch,env.GITHUB_TOKEN);if(path==='.buildone/trigger.json')triggerSha=s}await logDb(env,{build_id:buildId,repo,branch,type,status:'QUEUED',trigger_sha:triggerSha,created_at:new Date().toISOString()});return {ok:true,service:'BuildOne Worker',build_id:buildId,type,triggerSha,workflow:'buildone.yml'}}
async function status(req,env){const u=new URL(req.url),o=u.searchParams.get('owner'),r=u.searchParams.get('repo'),trigger=u.searchParams.get('trigger_sha'),buildId=u.searchParams.get('build_id'),type=u.searchParams.get('type');if(`${o}/${r}`!=='EarnPlayApps/BuildOne'||!repoOk(`${o}/${r}`))throw Error('BuildOne repository is invalid');const x=await gh(`${GH}/repos/${o}/${r}/actions/runs?event=push&per_page=50`,env.GITHUB_TOKEN);if(!x.ok)throw Error(`BuildOne runs lookup failed: ${x.status}`);const runs=(await x.json()).workflow_runs||[];let run=null;if(trigger)run=runs.find(z=>z.path?.endsWith('/buildone.yml')&&z.head_sha===trigger)||null;else if(buildId){for(const z of runs.filter(z=>z.path?.endsWith('/buildone.yml'))){const tx=await gh(`${GH}/repos/${o}/${r}/contents/.buildone/trigger.json?ref=${encodeURIComponent(z.head_sha)}`,env.GITHUB_TOKEN);if(tx.ok)try{const j=await tx.json(),raw=decodeURIComponent(escape(atob(j.content.replace(/\n/g,''))));if(JSON.parse(raw).build_id===buildId){run=z;break}}catch(_){} }}else run=runs.find(z=>z.path?.endsWith('/buildone.yml'))||null;let artifacts=[];if(run?.id){const a=await gh(`${GH}/repos/${o}/${r}/actions/runs/${run.id}/artifacts`,env.GITHUB_TOKEN);if(a.ok)artifacts=(await a.json()).artifacts||[]}const exact=!!run&&(!trigger||run.head_sha===trigger),mapped=artifacts.map(a=>({id:a.id,name:a.name,size:a.size_in_bytes,expired:a.expired,digest:a.digest,runId:a.workflow_run?.id,headSha:a.workflow_run?.head_sha,type:/buildone-(APK|AAB)-/i.exec(a.name||'')?.[1]||null,verified:!!run&&run.conclusion==='success'&&!a.expired&&a.size_in_bytes>0&&a.workflow_run?.id===run.id&&a.workflow_run?.head_sha===run.head_sha&&(!type||/buildone-(APK|AAB)-/i.exec(a.name||'')?.[1]===type)}));if(buildId)await logDb(env,{build_id:buildId,repo:`${o}/${r}`,type:type||null,status:run?.conclusion||run?.status||'QUEUED',run_id:run?.id||null,run_sha:run?.head_sha||null,updated_at:new Date().toISOString()});return {ok:true,exact_match:exact,run:run&&{id:run.id,status:run.status,conclusion:run.conclusion,sha:run.head_sha,url:run.html_url},artifacts:mapped}}
async function verifyAds(req){const u=new URL(req.url),domain=(u.searchParams.get('domain')||'').trim().toLowerCase(),pub=(u.searchParams.get('publisherId')||'').trim();if(!pubOk(pub)||!domainOk(domain)||privateHost(domain))throw Error('Invalid developer domain or publisher ID');const expected=`google.com, ${pub}, DIRECT, f08c47fec0942fa0`,url=`https://${domain}/app-ads.txt`,ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);try{const r=await fetch(url,{redirect:'error',signal:ctl.signal,headers:{Accept:'text/plain','User-Agent':'BuildOne-app-ads-verifier/1.0'}});if(!r.ok)return {ok:true,verified:false,reason:`HTTP ${r.status}`,url};const text=await r.text();if(text.length>1048576)return {ok:true,verified:false,reason:'File exceeds 1 MB',url};const verified=text.split(/\r?\n/).some(x=>x.trim()===expected);return {ok:true,verified,reason:verified?'Exact publisher entry found':'Expected publisher entry not found',url}}finally{clearTimeout(timer)}}
async function artifact(req,env){const u=new URL(req.url),o=u.searchParams.get('owner'),r=u.searchParams.get('repo'),id=u.searchParams.get('artifact_id'),runId=u.searchParams.get('run_id'),type=u.searchParams.get('type'),buildId=u.searchParams.get('build_id');if(`${o}/${r}`!=='EarnPlayApps/BuildOne'||!/^[0-9]+$/.test(id)||!/^[0-9]+$/.test(runId)||!['APK','AAB'].includes(type)||!buildId)throw Error('BuildOne artifact parameters are incomplete');const ax=await gh(`${GH}/repos/${o}/${r}/actions/artifacts/${id}`,env.GITHUB_TOKEN);if(!ax.ok)throw Error(`Artifact lookup failed: ${ax.status}`);const a=await ax.json();if(a.expired||a.size_in_bytes<=0)throw Error('Artifact is expired or empty');if(String(a.workflow_run?.id)!==String(runId))throw Error('Artifact/run ID mismatch');if(!new RegExp(`buildone-${type}-`,'i').test(a.name||''))throw Error('Artifact type mismatch');const rx=await gh(`${GH}/repos/${o}/${r}/actions/runs/${runId}`,env.GITHUB_TOKEN);if(!rx.ok)throw Error('Build run lookup failed');const run=await rx.json();if(run.conclusion!=='success')throw Error('Download blocked: build is not successful');if(a.workflow_run?.head_sha!==run.head_sha)throw Error('Download blocked: artifact/run commit mismatch');const bx=await gh(`${GH}/repos/${o}/${r}/actions/runs/${runId}/artifacts`,env.GITHUB_TOKEN);if(!bx.ok)throw Error('Artifact list verification failed');const list=(await bx.json()).artifacts||[];const meta=list.find(z=>z.id===a.id);if(!meta||meta.size_in_bytes<=0)throw Error('Artifact verification failed');const zip=await gh(`${GH}/repos/${o}/${r}/actions/artifacts/${id}/zip`,env.GITHUB_TOKEN);if(!zip.ok)throw Error(`Artifact download failed: ${zip.status}`);return new Response(zip.body,{headers:{...C,'content-type':'application/zip','content-disposition':`attachment; filename="BuildOne-${type}-${buildId}.zip"`}})}
async function health(env){return {ok:true,service:'BuildOne Worker',name:'BuildOne',github:!!env.GITHUB_TOKEN,artifactGate:'strict',exactBuildTracking:true,adsVerification:true,supabase:!!env.SUPABASE_URL,timestamp:new Date().toISOString()}}
export default {async fetch(req,env){if(req.method==='OPTIONS')return new Response(null,{headers:C});try{const u=new URL(req.url);if(env.BUILDONE_KEY&&req.headers.get('x-buildone-key')!==env.BUILDONE_KEY)return json({ok:false,error:'BuildOne API key required'},401);if(u.pathname==='/health')return json(await health(env));if(u.pathname==='/build'&&req.method==='POST')return json(await build(req,env));if(u.pathname==='/status')return json(await status(req,env));if(u.pathname==='/artifact')return artifact(req,env);if(u.pathname==='/verify-app-ads-txt')return json(await verifyAds(req));return json({ok:false,error:'BuildOne route not found'},404)}catch(e){return json({ok:false,error:e?.message||String(e)},400)}}};
