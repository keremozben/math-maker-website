/**
 * lang.js — site-wide language persistence (same pattern as grid-collection.com).
 *
 *  - Picking a language in the .lang-select switcher saves the choice to
 *    localStorage (a capture-phase listener runs before the inline onchange
 *    navigates).
 *  - On every page load, if a language was remembered, the in-page navigation
 *    links (marked with data-nav) are rewritten to that language's version, so
 *    the visitor keeps browsing in it. The current page is never auto-redirected.
 */
(function () {
  "use strict";

  // lang code (matches <html lang>) → site path
  var LANGS = { en: "/", tr: "/tr/" };
  // data-nav key → file within a language base
  var FILES = {
    home: "",
    support: "support.html",
    privacy: "privacy-policy.html",
    terms: "terms-of-service.html",
  };
  var KEY = "mathmakerLang";

  // "/tr/…" → tr, anything else → en
  function langOfPath(path) {
    for (var code in LANGS) {
      if (LANGS[code] !== "/" && path.indexOf(LANGS[code]) === 0) return code;
    }
    return "en";
  }

  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }
  function save(code) {
    try {
      localStorage.setItem(KEY, code);
    } catch (e) {
      /* private mode / disabled storage — ignore */
    }
  }

  var current = document.documentElement.lang || "en";
  if (!LANGS[current]) current = "en";

  var sel = document.querySelector(".lang-select");
  if (sel) {
    sel.addEventListener(
      "change",
      function () {
        if (this.value) save(langOfPath(this.value));
      },
      true,
    );
  }

  var stored = read();
  var target = stored && LANGS[stored] ? stored : current;
  if (target !== current) {
    var base = LANGS[target];
    var links = document.querySelectorAll("[data-nav]");
    for (var i = 0; i < links.length; i++) {
      var nav = links[i].getAttribute("data-nav");
      if (FILES[nav] !== undefined) links[i].setAttribute("href", base + FILES[nav]);
    }
    // the switcher keeps showing the language of the page actually displayed
  }
})();
