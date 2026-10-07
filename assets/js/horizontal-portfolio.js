(function () {
  "use strict";

  var main = document.getElementById("main");
  var sourceContent = main && main.querySelector(".page-shell");
  var nav = document.querySelector(".nav-list");
  if (!main || !sourceContent || !nav) return;

  var sections = Array.prototype.map.call(nav.querySelectorAll("a"), function (link) {
    var label = link.textContent.trim();
    var title = label === "Experience" ? "Work experience" : label;
    return { title: title, href: link.href, link: link };
  });
  if (sections.length !== 4) return;

  var normalizedPath = function (value) {
    var path = new URL(value, window.location.href).pathname;
    return path.length > 1 ? path.replace(/\/+$/, "") + "/" : "/";
  };
  var sectionForPath = function (path) {
    var normalized = normalizedPath(path);
    return sections.findIndex(function (section) {
      return normalizedPath(section.href) === normalized;
    });
  };
  var initialIndex = sectionForPath(window.location.pathname);
  if (initialIndex < 0) return;

  var currentMarkup = sourceContent;
  sections[initialIndex].documentTitle = document.title;
  var controls = document.createElement("div");
  controls.className = "horizontal-controls";
  controls.innerHTML =
    '<label class="horizontal-mode"><span class="horizontal-controls-label">Scroll behavior</span>' +
    '<select aria-label="Choose horizontal scrolling behavior">' +
    '<option value="section">Section snap</option><option value="soft">Soft snap</option>' +
    '<option value="continuous">Continuous</option></select></label>' +
    '<nav class="horizontal-section-nav" aria-label="Portfolio sections"></nav>' +
    '<div class="horizontal-stepper"><button type="button" data-step="-1" aria-label="Previous section">←</button>' +
    '<button type="button" data-step="1" aria-label="Next section">→</button></div>';

  var sectionNav = controls.querySelector(".horizontal-section-nav");
  sections.forEach(function (section, index) {
    var link = document.createElement("a");
    link.href = section.href;
    link.textContent = section.title;
    link.dataset.index = String(index);
    sectionNav.appendChild(link);
  });

  var stage = document.createElement("div");
  stage.className = "horizontal-stage";
  stage.id = "portfolio-panels";
  stage.tabIndex = 0;
  stage.setAttribute("aria-label", "Portfolio sections. Use the left and right arrow keys to move between sections.");
  stage.dataset.mode = "section";

  var status = document.createElement("p");
  status.className = "horizontal-status";
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  controls.appendChild(status);
  var help = document.createElement("p");
  help.className = "horizontal-help";
  help.id = "horizontal-help";
  help.textContent = "Swipe sideways or use the arrows to change sections. Scroll down within each section to read more.";
  controls.appendChild(help);
  stage.setAttribute("aria-describedby", help.id);
  stage.setAttribute("role", "region");

  var panels = [];
  sections.forEach(function (section, index) {
    var panel = document.createElement("section");
    panel.className = "horizontal-panel";
    panel.id = "portfolio-section-" + (index + 1);
    panel.dataset.index = String(index);
    panel.dataset.path = normalizedPath(section.href);
    panel.tabIndex = -1;
    panel.setAttribute("aria-label", section.title);
    if (index === initialIndex) {
      panel.appendChild(currentMarkup);
    } else {
      panel.innerHTML = '<div class="horizontal-skeleton" aria-label="Loading section" role="status">' +
        "<span></span><span></span><span></span><span></span></div>";
    }
    panels.push(panel);
    stage.appendChild(panel);
  });

  main.replaceChildren(controls, stage);
  main.classList.add("horizontal-ready");

  var activeIndex = initialIndex;
  var scrollFrame = 0;
  var settleTimer = 0;
  var pendingIndex = null;
  var pendingFocus = false;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function panelPosition(panel) {
    return panel.getBoundingClientRect().left - stage.getBoundingClientRect().left + stage.scrollLeft;
  }

  function updateActive(index, writeHistory) {
    index = Math.max(0, Math.min(sections.length - 1, index));
    var changed = index !== activeIndex;
    activeIndex = index;

    sectionNav.querySelectorAll("a").forEach(function (link, linkIndex) {
      if (linkIndex === index) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    sections.forEach(function (section, sectionIndex) {
      if (sectionIndex === index) section.link.setAttribute("aria-current", "page");
      else section.link.removeAttribute("aria-current");
      panels[sectionIndex].inert = sectionIndex !== index;
      panels[sectionIndex].setAttribute("aria-hidden", String(sectionIndex !== index));
    });
    controls.querySelector('[data-step="-1"]').disabled = index === 0;
    controls.querySelector('[data-step="1"]').disabled = index === sections.length - 1;
    if (changed || !status.textContent) {
      status.textContent = sections[index].title + ", section " + (index + 1) + " of " + sections.length;
    }
    if (sections[index].documentTitle) document.title = sections[index].documentTitle;

    if (writeHistory && changed) {
      window.history.replaceState({ portfolioSection: index }, "", sections[index].href);
    }
    if (changed && panels.some(function (panel) {
      return panel !== panels[index] && panel.contains(document.activeElement);
    })) {
      panels[index].focus({ preventScroll: true });
    }
  }

  function nearestPanel() {
    var center = stage.scrollLeft + stage.clientWidth / 2;
    var closest = 0;
    var distance = Infinity;
    panels.forEach(function (panel, index) {
      var nextDistance = Math.abs(center - panelPosition(panel) - panel.offsetWidth / 2);
      if (nextDistance < distance) {
        closest = index;
        distance = nextDistance;
      }
    });
    return closest;
  }

  function settleScroll() {
    window.clearTimeout(settleTimer);
    var nearest = nearestPanel();
    var requested = pendingIndex;
    var focus = pendingFocus;
    pendingIndex = null;
    pendingFocus = false;
    updateActive(nearest, requested === null || nearest !== requested);
    if (focus) panels[nearest].focus({ preventScroll: true });
  }

  function moveTo(index, options) {
    options = options || {};
    index = Math.max(0, Math.min(sections.length - 1, index));
    var panel = panels[index];
    if (options.pushHistory && sectionForPath(window.location.pathname) !== index) {
      window.history.pushState({ portfolioSection: index }, "", sections[index].href);
    }
    pendingIndex = index;
    pendingFocus = Boolean(options.focus);
    updateActive(index, false);
    stage.scrollTo({
      left: panelPosition(panel),
      behavior: reduceMotion.matches ? "instant" : "smooth"
    });
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settleScroll, 180);
  }

  controls.addEventListener("click", function (event) {
    var button = event.target.closest("[data-step]");
    if (!button) return;
    moveTo(activeIndex + Number(button.dataset.step), { pushHistory: true, focus: true });
  });

  controls.querySelector("select").addEventListener("change", function (event) {
    stage.dataset.mode = event.target.value;
  });

  stage.addEventListener("keydown", function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey ||
      event.target.matches("input, textarea, select, [contenteditable='true']")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTo(activeIndex + 1, { pushHistory: true, focus: true });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTo(activeIndex - 1, { pushHistory: true, focus: true });
    } else if (event.key === "Home") {
      event.preventDefault();
      moveTo(0, { pushHistory: true, focus: true });
    } else if (event.key === "End") {
      event.preventDefault();
      moveTo(sections.length - 1, { pushHistory: true, focus: true });
    }
  });

  stage.addEventListener("scroll", function () {
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(function () {
      if (pendingIndex === null) updateActive(nearestPanel(), true);
    });
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settleScroll, 160);
  }, { passive: true });
  stage.addEventListener("scrollend", settleScroll);

  window.addEventListener("popstate", function () {
    var index = sectionForPath(window.location.pathname);
    if (index >= 0) {
      moveTo(index, { focus: true });
    }
  });

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest("a[href]");
    if (!link || link.target || link.hasAttribute("download") || link.hasAttribute("data-full-navigation")) return;
    var destination;
    try { destination = new URL(link.href, window.location.href); } catch (error) { return; }
    if (destination.origin !== window.location.origin || destination.hash) return;
    var index = sectionForPath(destination.pathname);
    if (index < 0) return;
    event.preventDefault();
    moveTo(index, { pushHistory: true, focus: true });
  });

  function showFailure(panel, index) {
    panel.setAttribute("aria-busy", "false");
    panel.innerHTML = "";
    var box = document.createElement("div");
    box.className = "horizontal-load-state";
    box.innerHTML = '<span class="section-kicker">SECTION UNAVAILABLE</span>' +
      "<h2>" + sections[index].title + "</h2>" +
      "<p>This section could not be loaded right now. You can retry here or open its regular page directly.</p>";
    var retry = document.createElement("button");
    retry.type = "button";
    retry.className = "button button-primary";
    retry.textContent = "Retry loading";
    retry.addEventListener("click", function () { loadSection(index); });
    var fallback = document.createElement("a");
    fallback.className = "button text-link";
    fallback.href = sections[index].href;
    fallback.setAttribute("data-full-navigation", "");
    fallback.textContent = "Open section page";
    box.append(retry, fallback);
    panel.appendChild(box);
  }

  function loadSection(index) {
    var panel = panels[index];
    panel.setAttribute("aria-busy", "true");
    panel.innerHTML = '<div class="horizontal-skeleton" aria-label="Loading section" role="status">' +
      "<span></span><span></span><span></span><span></span></div>";
    fetch(sections[index].href, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("Section request failed");
        return response.text();
      })
      .then(function (html) {
        var parsed = new DOMParser().parseFromString(html, "text/html");
        var content = parsed.querySelector("#main .page-shell");
        if (!content) throw new Error("Section content not found");
        sections[index].documentTitle = parsed.title;
        panel.replaceChildren(document.importNode(content, true));
        panel.setAttribute("aria-busy", "false");
        if (index === activeIndex) document.title = parsed.title;
      })
      .catch(function () {
        showFailure(panel, index);
      });
  }

  sections.forEach(function (_section, index) {
    if (index !== initialIndex) loadSection(index);
  });

  window.requestAnimationFrame(function () {
    fitStage();
    stage.scrollTo({ left: panelPosition(panels[initialIndex]), behavior: "instant" });
    updateActive(initialIndex, false);
  });

  var stageWidth = 0;
  function fitStage() {
    var header = document.querySelector(".site-header");
    var available = window.innerHeight - (header ? header.offsetHeight : 0) - controls.offsetHeight - 8;
    stage.style.height = Math.max(220, available) + "px";
    if (stageWidth && stageWidth !== stage.clientWidth) {
      pendingIndex = null;
      pendingFocus = false;
      stage.scrollTo({ left: panelPosition(panels[activeIndex]), behavior: "instant" });
    }
    stageWidth = stage.clientWidth;
  }
  window.addEventListener("resize", fitStage);
  if (window.ResizeObserver) {
    var resizeObserver = new ResizeObserver(fitStage);
    resizeObserver.observe(controls);
    resizeObserver.observe(stage);
    var header = document.querySelector(".site-header");
    if (header) resizeObserver.observe(header);
  }
})();
