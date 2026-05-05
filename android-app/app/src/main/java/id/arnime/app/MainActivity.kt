package id.arnime.app

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.*
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout

    companion object {
        const val APP_URL = "https://arnime.ammaricano.my.id"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefresh = findViewById(R.id.swipeRefresh)

        setupWebView()
        setupSwipeRefresh()

        // Restore state or load URL
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl(APP_URL)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // localStorage / sessionStorage
            databaseEnabled = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false  // autoplay video
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            userAgentString = userAgentString.replace("wv", "") // remove WebView tag
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                // Open external links in browser, keep internal links in WebView
                return if (url.startsWith(APP_URL) || url.startsWith("about:")) {
                    false // handle in WebView
                } else {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.isVisible = newProgress < 100
            }

            // Allow camera/microphone permissions if needed
            override fun onPermissionRequest(request: PermissionRequest) {
                request.grant(request.resources)
            }
        }

        // Enable cookies
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(
            resources.getColor(R.color.indigo, theme)
        )
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    // Handle back button — navigate WebView history
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    // Save WebView state on rotation
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
