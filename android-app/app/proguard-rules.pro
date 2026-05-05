# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep app classes
-keep class id.arnime.app.** { *; }
