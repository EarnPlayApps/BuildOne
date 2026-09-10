package com.buildone.generated;
import android.app.Activity;import android.os.Bundle;import android.webkit.WebSettings;import android.webkit.WebView;import android.webkit.WebViewClient;
public class MainActivity extends Activity { @Override public void onCreate(Bundle b){super.onCreate(b);setContentView(com.buildone.generated.R.layout.activity_main);WebView w=findViewById(com.buildone.generated.R.id.web);w.setWebViewClient(new WebViewClient());WebSettings s=w.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);w.loadUrl("file:///android_asset/index.html");} }
