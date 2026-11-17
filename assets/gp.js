  (function () {
    "use strict";
    var doc = document;
    var body = doc.body;
    var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    /* logo: play() runs the intro from the start, arm() holds it on its first frame,
       release() lets a held logo run */
    var logo = (function () {
      function restart(svg, hold) {
        svg.classList.remove("is-anim", "is-hold");
        void svg.getBoundingClientRect();
        svg.classList.add("is-anim");
        if (hold) svg.classList.add("is-hold");
      }
      return {
        play: function (svg) { if (svg && !reduce) restart(svg, false); },
        arm: function (svg) { if (svg && !reduce) restart(svg, true); },
        release: function (svg) { if (svg) svg.classList.remove("is-hold"); }
      };
    })();

    /* copy the email address */
    (function () {
      var btn = doc.getElementById("copy");
      var addr = doc.getElementById("addr");
      if (!btn || !addr) return;
      function flash(text) {
        btn.textContent = text;
        btn.setAttribute("data-done", "1");
        setTimeout(function () {
          btn.textContent = "Copy";
          btn.removeAttribute("data-done");
        }, 2000);
      }
      function selectAddr() {
        try {
          var range = doc.createRange();
          range.selectNodeContents(addr);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          flash("Selected");
        } catch (e) {
          flash("Select it");
        }
      }
      btn.addEventListener("click", function () {
        var text = addr.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { flash("Copied"); }, selectAddr);
        } else {
          selectAddr();
        }
      });
    })();

    /* menu drawer */
    (function () {
      var drawer = doc.getElementById("menu");
      var closeBtn = doc.getElementById("menuClose");
      if (!drawer || !closeBtn) return;
      var openers = [].slice.call(doc.querySelectorAll("[data-menu]"));
      var drawerLogo = drawer.querySelector(".gpl");
      var back = null;
      function isOpen() { return drawer.classList.contains("is-open"); }
      function setMenu(open) {
        drawer.classList.toggle("is-open", open);
        drawer.setAttribute("aria-hidden", open ? "false" : "true");
        body.classList.toggle("menu-open", open);
        openers.forEach(function (b) { b.setAttribute("aria-expanded", String(open)); });
        if (open) {
          back = doc.activeElement;
          closeBtn.focus();
          logo.play(drawerLogo);
        } else if (back && back.focus) {
          back.focus();
        }
      }
      openers.forEach(function (b) { b.addEventListener("click", function () { setMenu(true); }); });
      closeBtn.addEventListener("click", function () { setMenu(false); });
      drawer.addEventListener("click", function (e) {
        if (e.target.hasAttribute("data-close")) {
          setMenu(false);
        } else if (e.target.closest("a")) {
          back = null;
          setMenu(false);
        }
      });
      doc.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen()) setMenu(false);
      });
      var wide = window.matchMedia ? window.matchMedia(drawer.getAttribute("data-wide") || "(min-width: 901px)") : null;
      if (wide && wide.addEventListener) {
        wide.addEventListener("change", function (e) {
          if (e.matches && isOpen()) setMenu(false);
        });
      }
    })();

    /* header: one logo. It starts as the brandmark, opens into the wordmark at the top of the page,
       folds back into the brandmark while the page is scrolled, and opens again back at the top */
    (function () {
      var top = doc.getElementById("siteTop");
      var sentinel = doc.getElementById("topSentinel");
      if (!top) return;
      var svg = top.querySelector(".gpl-hdr");
      var scrolled = null;
      var ready = false;
      function apply() { top.classList.toggle("is-mark", !ready || scrolled === true); }
      function setScrolled(on) {
        if (on === scrolled) return;
        scrolled = on;
        top.classList.toggle("is-scrolled", on);
        apply();
      }
      if ("IntersectionObserver" in window && sentinel) {
        new IntersectionObserver(function (entries) {
          setScrolled(!entries[0].isIntersecting);
        }).observe(sentinel);
      } else {
        var onScroll = function () { setScrolled(window.scrollY > 120); };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      }
      /* the wordmark opens once the G and its crest have come in */
      function intro() {
        setTimeout(function () { ready = true; apply(); }, 1800);
      }
      if (reduce) {
        ready = true;
        apply();
      } else if (doc.hidden) {
        /* opened in a background tab: play the intro when the tab is first shown */
        var shown = function () {
          if (doc.hidden) return;
          doc.removeEventListener("visibilitychange", shown);
          logo.play(svg);
          intro();
        };
        doc.addEventListener("visibilitychange", shown);
      } else {
        intro();
      }
    })();

    /* footer: the G grows into the wordmark each time it scrolls into view */
    (function () {
      var svg = doc.querySelector(".foot .gpl");
      if (!svg || reduce || !("IntersectionObserver" in window)) return;
      var shown = false;
      logo.arm(svg);
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        if (!shown && e.intersectionRatio >= 0.9) {
          shown = true;
          logo.release(svg);
        } else if (shown && !e.isIntersecting) {
          shown = false;
          logo.arm(svg);
        }
      }, { threshold: [0, 0.9] }).observe(svg);
    })();

  })();
