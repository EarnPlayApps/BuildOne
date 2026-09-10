package com.buildone.generated;

import android.app.Activity;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.LoadAdError;
import android.util.Log;

public class MainActivity extends Activity {
    private static final String BANNER_ID = "ca-app-pub-9940728659432865/5564274675";
    private static final String INTERSTITIAL_ID = "ca-app-pub-9940728659432865/4251193002";
    private InterstitialAd interstitialAd;

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        setContentView(R.layout.activity_main);
        WebView w = findViewById(R.id.web);
        w.setWebViewClient(new WebViewClient());
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        w.loadUrl("file:///android_asset/index.html");

        MobileAds.initialize(this, status -> {});
        loadBanner();
        loadInterstitial();
    }

    private void loadBanner() {
        AdView ad = new AdView(this);
        ad.setAdUnitId(BANNER_ID);
        ad.setAdSize(AdSize.getLargeAnchoredAdaptiveBannerAdSize(this, 360));
        ViewGroup container = findViewById(R.id.ad_container);
        container.removeAllViews();
        container.addView(ad, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        ad.loadAd(new AdRequest.Builder().build());
    }

    private void loadInterstitial() {
        InterstitialAd.load(this, INTERSTITIAL_ID, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override public void onAdLoaded(InterstitialAd ad) { interstitialAd = ad; }
            @Override public void onAdFailedToLoad(LoadAdError error) { interstitialAd = null; Log.w("BuildOneAds", error.toString()); }
        });
    }

    public void showInterstitial() {
        if (interstitialAd != null) {
            interstitialAd.show(this);
            interstitialAd = null;
            loadInterstitial();
        }
    }
}
