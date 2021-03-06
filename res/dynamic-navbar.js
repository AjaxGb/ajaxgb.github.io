"use strict";

var nav = document.getElementById("navbar"),
    currLink = nav.getElementsByClassName("current")[0],
    sel = nav.getElementsByClassName("selector")[0],
    pageEl = document.getElementById("page"),
    pageWrapEl = document.getElementById("page-wrapper"),
    loadWrapEl = pageWrapEl.getElementsByClassName("loading-bar-wrapper")[0],
    loadBarEl = loadWrapEl.getElementsByClassName("loading-bar")[0],
    genTimestamp = document.head.querySelector('meta[itemprop="gen-timestamp"]').content,
    loadReq, fadeOutDelay, fadeInCallback;

sel.style.top = nav.getElementsByClassName("current")[0].offsetTop + "px";
nav.classList.remove("static-chevron");

addEventListener("click", function(e) {
	if (e.target.tagName === "A" && e.target.getAttribute("href")[0] === "/") {
		if (loadPage(e.target.pathname)) return false;
	}
});

addEventListener("popstate", function(e) {
	loadPage(location.pathname, {
		dontChangeURL: true,
		scrollTop: (e.state && e.state.pageScroll)
			? e.state.pageScroll
			: 0
	});
});

if (history.state && history.state.pageScroll) {
	pageEl.scrollTop = history.state.pageScroll;
}

addEventListener("beforeunload", function() {
	history.replaceState({
		pageScroll: pageEl.scrollTop
	}, "");
});

function normalizePath(path) {
	path = path.replace(/\/$/, "");
	if (!path) return "/";
	if (path[0] !== "/") return "/" + path;
	return path;
}

function selectSidebarLink(newLink) {
	currLink.classList.remove("current");
	currLink = newLink;
	currLink.classList.add("current");
	sel.style.top = currLink.offsetTop + "px";
}

// options: dontChangeURL, scrollTop
function loadPage(path, options) {
	path = normalizePath(path);
	options = options || {};
	
	var sideLink = nav.querySelector('a[href="' + path + '"]');
	if (!sideLink) return false;

	var fragURL = (path === "/") ? "/fragments/index.html" : "/fragments" + path + ".html";
	
	// Avoid cache issues
	fragURL += "?t=" + genTimestamp;
	
	selectSidebarLink(sideLink);
	
	if (loadReq) loadReq.abort();
	if (!options.dontChangeURL) {
		history.replaceState({
			pageScroll: pageEl.scrollTop
		}, "");
	}
	
	loadReq = new XMLHttpRequest();
	loadReq.open("GET", fragURL);
	
	loadReq.onload = function() {
		if (this.status < 200 || this.status > 299) {
			this.onerror();
			return;
		}
		loadBarEl.style.width = "100%";
		loadReq = null;
		
		var pageFragment = this.response;
		function fadeIn() {
			pageWrapEl.classList.remove("loading");
			loadWrapEl.classList.remove("hidden");
			pageEl.innerHTML = pageFragment;
			
			try {
				twttr.widgets.load(pageEl);
			} catch (e) {
				// I tried
			}
			
			pageEl.scrollTop = options.scrollTop || 0;
			if (!options.dontChangeURL) {
				history.pushState(null, "", path);
			}
		}
		
		if (fadeOutDelay) {
			fadeInCallback = fadeIn;
			loadWrapEl.classList.add("hidden");
		} else {
			fadeIn();
		}
	};
	loadReq.onerror = function() {
		// Just go to the 404 page or whatever.
		window.location = path;
	};
	loadReq.onprogress = function(e) {
		loadBarEl.style.width = (e.loaded * 100 / e.total) + "%";
	};
	
	loadReq.send();
	pageWrapEl.classList.add("loading");
	loadBarEl.style.width = 0;
	
	fadeOutDelay = fadeOutDelay || setTimeout(function() {
		fadeOutDelay = null;
		if (fadeInCallback) {
			fadeInCallback();
			fadeInCallback = null;
		}
	}, 200);
	
	return true;
}
