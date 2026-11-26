package com.earnplayapps.autoquotationmaker;

import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Color;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView web;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(244,246,251));
        getWindow().setNavigationBarColor(Color.rgb(244,246,251));
        getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(-1,-1));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Bridge(), "NativeApp");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }
    private class Bridge {
        @JavascriptInterface public void printDocument() {
            runOnUiThread(() -> {
                PrintManager pm=(PrintManager)getSystemService(Context.PRINT_SERVICE);
                android.print.PrintDocumentAdapter adapter=web.createPrintDocumentAdapter("Quotation");
                pm.print("Quotation",adapter,new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).setResolution(new PrintAttributes.Resolution("pdf","PDF",300,300)).setMinMargins(PrintAttributes.Margins.NO_MARGINS).build());
            });
        }
        @JavascriptInterface public void message(String s) { runOnUiThread(() -> Toast.makeText(MainActivity.this,s,Toast.LENGTH_SHORT).show()); }
    }
    @Override public void onBackPressed() {
        if(web!=null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
