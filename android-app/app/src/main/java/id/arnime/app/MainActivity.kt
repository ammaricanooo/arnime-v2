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

        // Domains that must stay inside WebView for OAuth to work correctly.
        // Firebase Auth uses these for Google & GitHub sign-in popups/redirects.
        private val OAUTH_DOMAINS = listOf(
            "accounts.google.com",
            "github.com",
            "firebaseapp.com",
            "firebase.google.com",
            "identitytoolkit.googleapis.com",
            "securetoken.googleapis.com",
            "oauth2.googleapis.com",
        )
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
            // Remove "wv" tag so sites don't block WebView user agents
            userAgentString = userAgentString.replace("wv", "")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val url = request.url.toString()
                val host = request.url.host ?: ""

                // Always handle in WebView:
                //   • our own app domain
                //   • OAuth provider domains (Google, GitHub, Firebase)
                //   • about: / javascript: / data: schemes
                val isInternal = url.startsWith(APP_URL)
                    || url.startsWith("about:")
                    || url.startsWith("javascript:")
                    || url.startsWith("data:")
                    || OAUTH_DOMAINS.any { host.endsWith(it) }

                return if (isInternal) {
                    false // let WebView handle it
                } else {
                    // Open truly external links (e.g. download links) in browser
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } catch (_: Exception) { /* no handler — ignore */ }
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                // Re-evaluate pull-to-refresh eligibility after each page load
                updateSwipeRefreshEnabled()
            }
        }

        // Allow popups — Firebase Auth (Google/GitHub) uses window.open() for OAuth
        webView.settings.setSupportMultipleWindows(true)
        webView.settings.javaScriptCanOpenWindowsAutomatically = true

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.isVisible = newProgress < 100
            }

            // Grant camera/microphone for video players
            override fun onPermissionRequest(request: PermissionRequest) {
                request.grant(request.resources)
            }

            // Handle window.open() — used by Firebase Auth OAuth popups
            override fun onCreateWindow(
                view: WebView,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message,
            ): Boolean {
                val popupWebView = WebView(this@MainActivity).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.userAgentString = view.settings.userAgentString
                    CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)

                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(
                            v: WebView,
                            request: WebResourceRequest,
                        ): Boolean {
                            val url = request.url.toString()
                            // When OAuth redirects back to our app, load it in the main WebView
                            if (url.startsWith(APP_URL)) {
                                webView.loadUrl(url)
                                // Close the popup
                                (v.parent as? android.view.ViewGroup)?.removeView(v)
                                v.destroy()
                                return true
                            }
                            return false
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        // Popup closed by JS (window.close())
                        override fun onCloseWindow(window: WebView) {
                            (window.parent as? android.view.ViewGroup)?.removeView(window)
                            window.destroy()
                        }
                    }
                }

                // Attach popup WebView on top of main layout
                val container = findViewById<android.view.ViewGroup>(android.R.id.content)
                val params = android.view.ViewGroup.LayoutParams(
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                )
                container.addView(popupWebView, params)

                // Connect the new window transport
                val transport = resultMsg.obj as WebView.WebViewTransport
                transport.webView = popupWebView
                resultMsg.sendToTarget()
                return true
            }

            override fun onCloseWindow(window: WebView) {
                (window.parent as? android.view.ViewGroup)?.removeView(window)
                window.destroy()
            }
        }

        // Disable overscroll glow — prevents the "pull-to-refresh" feel on scroll up
        webView.overScrollMode = android.view.View.OVER_SCROLL_NEVER

        // Disable WebView's own scroll-to-top on status-bar tap (conflicts with SwipeRefresh)
        webView.setOnScrollChangeListener { _, _, scrollY, _, _ ->
            // Only allow SwipeRefreshLayout to trigger when WebView is scrolled to the very top
            swipeRefresh.isEnabled = scrollY == 0
        }

        // Enable cookies (required for Firebase Auth session persistence)
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
        // Start disabled; enabled only when WebView is at the top
        swipeRefresh.isEnabled = true
    }

    /** Sync SwipeRefreshLayout enabled state with WebView scroll position. */
    private fun updateSwipeRefreshEnabled() {
        swipeRefresh.isEnabled = !webView.canScrollVertically(-1)
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
