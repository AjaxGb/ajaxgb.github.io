"use strict";

var nav = document.getElementById("navbar"),
    currLink = nav.getElementsByClassName("current")[0],
    sel = nav.getElementsByClassName("selector")[0],
    pageEl = document.getElementById("page"),
    wrapEl = document.getElementById("page-wrapper"),
    loadBar = wrapEl.getElementsByClassName("loading-bar")[0],
    loadReq, fadeOutDelay, fadeInCallback;

sel.style.top = nav.getElementsByClassName("current")[0].offsetTop + "px";
nav.classList.remove("static-chevron");

nav.onclick = function(e) {
	if (e.target.tagName === "A") {
		loadPage(e.target.pathname, {sideLink: e.target});
		return false;
	}
};

onpopstate = function(e) {
	loadPage(location.pathname, {
		dontChangeURL: true,
		scrollTop: (e.state && e.state.pageScroll)
			? e.state.pageScroll
			: 0
	});
};

if (history.state && history.state.pageScroll) {
	pageEl.scrollTop = history.state.pageScroll;
}

onbeforeunload = function() {
	history.replaceState({
		pageScroll: pageEl.scrollTop
	}, "");
};

function normalizePath(path) {
	path = path.replace(/\/$/, "");
	if (!path) return "/";
	if (path[0] != "/") return "/" + path;
	return path;
}

function selectSidebarLink(newLink) {
	currLink.classList.remove("current");
	currLink = newLink;
	currLink.classList.add("current");
	sel.style.top = currLink.offsetTop + "px";
}

// options: sideLink, dontChangeURL, scrollTop
function loadPage(path, options) {
	path = normalizePath(path);
	
	var sideLink = options.sideLink
	    	|| nav.querySelector('a[href="' + path + '"]'),
		fragURL = (path === "/")
			? "/fragments/index.html"
			: "/fragments" + path + ".html";
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
		loadBar.style.width = "100%";
		loadReq = null;
		
		var pageFragment = this.response;
		function fadeIn() {
			wrapEl.classList.remove("loading");
			pageEl.innerHTML = pageFragment;
			pageEl.scrollTop = options.scrollTop || 0;
			if (!options.dontChangeURL) {
				history.pushState(null, "", path);
			}
		}
		
		if (fadeOutDelay) {
			fadeInCallback = fadeIn;
		} else {
			fadeIn();
		}
	};
	loadReq.onerror = function() {
		// Just go to the 404 page or whatever.
		window.location = path;
	};
	loadReq.onprogress = function(e) {
		loadBar.style.width = (e.loaded * 100 / e.total) + "%";
	};
	
	loadReq.send();
	wrapEl.classList.add("loading");
	loadBar.style.width = 0;
	
	fadeOutDelay = fadeOutDelay || setTimeout(function() {
		fadeOutDelay = null;
		if (fadeInCallback) {
			fadeInCallback();
			fadeInCallback = null;
		}
	}, 200);
}
