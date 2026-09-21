/* Native static-page navigation, with a short optional exit and arrival. */
(() => {
    'use strict';
    const root = document.documentElement;
    const surface = document.querySelector('main');
    if (!surface || !('animation' in root.style) || !window.matchMedia) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let entryTimer = 0;
    let exitTimer = 0;
    let recoveryTimer = 0;
    let pendingURL = null;
    let activeLink = null;

    function motionAllowed() {
        if (reducedMotion.matches || root.dataset.motion === 'paused') return false;
        try { return localStorage.getItem('dh-motion') !== 'paused'; }
        catch { return true; } // file:// and storage-blocked browsing retain native navigation.
    }

    function announcePhase(phase) {
        document.dispatchEvent(new CustomEvent('site:pagetransitionchange', {
            detail: { phase, active: Boolean(phase) }
        }));
    }

    function reset() {
        clearTimeout(entryTimer);
        clearTimeout(exitTimer);
        clearTimeout(recoveryTimer);
        entryTimer = exitTimer = recoveryTimer = 0;
        pendingURL = null;
        root.classList.remove('page-entering', 'page-exiting');
        if (activeLink) activeLink.classList.remove('page-link-active');
        activeLink = null;
        announcePhase(null);
    }

    function navigate() {
        const destination = pendingURL;
        if (!destination) return;
        pendingURL = null;
        clearTimeout(exitTimer);
        exitTimer = 0;
        // Restore the readable page if a browser policy or an aborted navigation keeps it open.
        recoveryTimer = setTimeout(reset, 700);
        try { window.location.assign(destination); }
        catch { reset(); }
    }

    function syncMotion() {
        if (motionAllowed()) return;
        const destination = pendingURL;
        reset();
        if (destination) {
            pendingURL = destination;
            navigate();
        }
    }

    function localPageDestination(link) {
        if (link.hasAttribute('download')) return null;
        const target = (link.getAttribute('target') || '').toLowerCase();
        if (target && target !== '_self') return null;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return null;
        try {
            const destination = new URL(link.href, document.baseURI);
            const current = new URL(window.location.href);
            if (destination.hash || !['http:', 'https:', 'file:'].includes(destination.protocol)) return null;
            if (destination.protocol !== current.protocol || destination.origin !== current.origin) return null;
            if (new URL('.', destination).pathname !== new URL('.', current).pathname) return null;
            const page = current.pathname.split('/').pop() || 'index.html';
            const nextPage = destination.pathname.split('/').pop() || 'index.html';
            if (!['index.html', 'resume.html'].includes(page) || !['index.html', 'resume.html'].includes(nextPage) || page === nextPage) return null;
            return destination.href;
        } catch { return null; }
    }

    document.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (!link) return;
        if (event.defaultPrevented) { if (pendingURL) reset(); return; }
        const destination = localPageDestination(link);
        if (!destination || !motionAllowed()) { if (pendingURL) reset(); return; }

        reset();
        root.classList.add('page-exiting');
        announcePhase('exit');
        // If the stylesheet is missing or animations are unavailable, follow the link normally.
        const animations = getComputedStyle(surface).animationName.split(',').map(name => name.trim());
        if (!animations.some(name => name === 'site-page-exit' || name === 'site-page-exit-fade')) {
            reset();
            return;
        }
        activeLink = link;
        activeLink.classList.add('page-link-active');
        pendingURL = destination;
        exitTimer = setTimeout(navigate, 180);
        event.preventDefault();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && pendingURL) reset();
    });
    document.addEventListener('site:motionchange', syncMotion);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncMotion);
    else if (reducedMotion.addListener) reducedMotion.addListener(syncMotion);
    window.addEventListener('storage', event => {
        if (event.key === 'dh-motion' || event.key === null) syncMotion();
    });
    if ('MutationObserver' in window) {
        new MutationObserver(syncMotion).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
    }
    window.addEventListener('pagehide', reset);
    window.addEventListener('pageshow', event => { if (event.persisted) reset(); });
    window.addEventListener('beforeprint', reset);

    if (motionAllowed()) {
        root.classList.add('page-entering');
        announcePhase('enter');
        entryTimer = setTimeout(reset, 300);
    }
})();
