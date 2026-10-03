package cz.maturita.trener;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Hlavní okno – webová aplikace ve WebView + most pro upozornění a soubory. */
public class MainActivity extends Activity {

    private static final int REQ_FILE = 1;
    private static final int REQ_NOTIFICATIONS = 2;
    static final String APP_URL = "file:///android_asset/index.html";

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Reminders.ensureChannel(this);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true); // localStorage – ukládání pokroku
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                // Odkazy na web (např. console.anthropic.com) otevřít v prohlížeči
                if ("http".equals(scheme) || "https".equals(scheme) || "mailto".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (ActivityNotFoundException ignored) {
                    }
                    return true;
                }
                return false;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "Vyber zálohu (JSON)"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(urlFor(getIntent()));
        }
    }

    private static String urlFor(Intent intent) {
        String route = intent != null ? intent.getStringExtra("route") : null;
        return route != null ? APP_URL + "#" + route : APP_URL;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String route = intent.getStringExtra("route");
        if (route != null && web != null) web.loadUrl(APP_URL + "#" + route);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_NOTIFICATIONS && web != null) {
            final boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
            web.post(new Runnable() {
                @Override
                public void run() {
                    web.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('android-notifications', {detail: " + granted + "}))", null);
                }
            });
        }
    }

    private boolean notificationsGranted() {
        return Build.VERSION.SDK_INT < 33
                || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    /** Funkce dostupné z JavaScriptu jako window.AndroidBridge */
    private class Bridge {
        @JavascriptInterface
        public int version() {
            return 1;
        }

        @JavascriptInterface
        public boolean notificationsAllowed() {
            return notificationsGranted();
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= 33 && !notificationsGranted()) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
                    }
                });
            }
        }

        /** Zapne / vypne denní připomínku v daném čase */
        @JavascriptInterface
        public void setReminder(boolean enabled, int hour, int minute) {
            Context ctx = getApplicationContext();
            prefs(ctx).edit()
                    .putBoolean(Reminders.KEY_ENABLED, enabled)
                    .putInt(Reminders.KEY_HOUR, hour)
                    .putInt(Reminders.KEY_MINUTE, minute)
                    .apply();
            if (enabled) Reminders.schedule(ctx);
            else Reminders.cancel(ctx);
        }

        /** Aktuální stav učení (série, poslední den učení, doporučení…) pro text upozornění */
        @JavascriptInterface
        public void updateStatus(String json) {
            prefs(getApplicationContext()).edit().putString(Reminders.KEY_STATUS, json).apply();
        }

        @JavascriptInterface
        public void testNotification() {
            Reminders.showReminder(getApplicationContext(), true);
        }

        /** Uloží soubor do složky Stažené soubory; vrátí popis umístění, nebo prázdný řetězec při chybě */
        @JavascriptInterface
        public String saveFile(String name, String content) {
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    v.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) return "";
                    try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                        if (out == null) return "";
                        out.write(bytes);
                    }
                    return "Stažené soubory/" + name;
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) return "";
                    File f = new File(dir, name);
                    try (FileOutputStream out = new FileOutputStream(f)) {
                        out.write(bytes);
                    }
                    return f.getAbsolutePath();
                }
            } catch (Exception e) {
                return "";
            }
        }
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences("reminders", Context.MODE_PRIVATE);
    }
}
