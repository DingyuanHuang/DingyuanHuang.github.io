/* Progressive enhancement: the full English page is readable without JavaScript. */
(() => {
    'use strict';
    const root = document.documentElement;
    const copy = window.siteTranslations;
    if (!copy) return;
    const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
    const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Private/storage-blocked browsing still works. */ } };
    let language = read('dh-language') === 'zh' ? 'zh' : 'en';
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let motion = !reducedMotion.matches && read('dh-motion') !== 'paused';
    const languageButton = document.getElementById('langToggle');
    const motionButton = document.getElementById('motionToggle');
    const menuButton = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const wideLayout = matchMedia('(min-width: 1024px)');
    const status = document.getElementById('site-status');
    const t = key => copy[language][key] || copy.en[key] || key;
    const effects = new Set();
    const elementEffects = new WeakMap();
    let refreshScrollLayout = () => {};
    let anchorDestination = null, anchorTimer = 0;
    const notifyLayout = () => document.dispatchEvent(new Event('site:layoutchange'));
    function translationY(element) {
        const values = getComputedStyle(element).transform.match(/^matrix(3d)?\((.+)\)$/);
        return values ? Number(values[2].split(',')[values[1] ? 13 : 5]) || 0 : 0;
    }

    function playFeedback(element, frames, options = {}) {
        if (!motion || document.hidden || !element || !element.animate) {
            element?.classList.remove('reveal-entering'); return null;
        }
        const previous = elementEffects.get(element);
        if (previous) previous.cancel();
        let effect;
        try {
            effect = element.animate(frames, {
                duration: 560, easing: 'cubic-bezier(.2,.75,.2,1)',
                fill: 'backwards', ...options
            });
        } catch { element.classList.remove('reveal-entering'); return null; }
        effect.id = options.id || 'site-feedback';
        effects.add(effect); elementEffects.set(element, effect);
        const finished = () => {
            effects.delete(effect);
            if (elementEffects.get(element) === effect) {
                elementEffects.delete(element); element.classList.remove('reveal-entering');
            }
            notifyLayout();
        };
        effect.addEventListener('finish', finished, { once: true });
        effect.addEventListener('cancel', finished, { once: true });
        notifyLayout();
        return effect;
    }
    function cancelFeedback() {
        effects.forEach(effect => effect.cancel());
        effects.clear(); notifyLayout();
    }
    function finishAnchorFeedback() {
        clearTimeout(anchorTimer);
        const target = anchorDestination;
        anchorDestination = null;
        if (!target || !motion) return;
        const heading = target.querySelector('h1, h2');
        if (!heading) return;
        const box = heading.getBoundingClientRect();
        if (box.bottom <= 0 || box.top >= innerHeight) return;
        playFeedback(heading, [
            { textShadow: '0 0 24px rgba(0,242,234,.75)' },
            { textShadow: '0 0 0 rgba(0,242,234,0)' }
        ], { duration: 720, id: 'section-arrival' });
    }

    function updateMotionLabel() {
        motionButton.querySelector('span').textContent = t(motion ? 'motion_pause_short' : 'motion_resume_short');
        motionButton.setAttribute('aria-label', t(motion ? 'motion_pause' : 'motion_resume'));
        motionButton.title = t(motion ? 'motion_pause' : 'motion_resume');
        motionButton.querySelector('i').className = motion ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    function setMenu(open, restoreFocus = false) {
        const wasFocused = menu.contains(document.activeElement);
        menu.hidden = !open;
        menu.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', t(open ? 'menu_close' : 'menu_open'));
        if (restoreFocus && wasFocused) menuButton.focus();
    }
    function updateContent(announce = false) {
        root.lang = language === 'zh' ? 'zh-Hans' : 'en';
        document.title = t('page_title');
        document.querySelector('meta[name="description"]').content = t('page_description');
        document.querySelector('meta[property="og:title"]').content = t('page_title');
        document.querySelector('meta[property="og:description"]').content = t('page_description');
        document.querySelector('meta[property="og:locale"]').content = language === 'zh' ? 'zh_CN' : 'en_US';
        document.querySelector('meta[property="og:image:alt"]').content = t('portrait_alt');
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (!copy[language][key]) return;
            if (el.hasAttribute('data-i18n-html')) el.innerHTML = t(key);
            else el.textContent = t(key);
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
        document.querySelectorAll('[data-i18n-alt]').forEach(el => el.alt = t(el.dataset.i18nAlt));
        languageButton.querySelector('span').textContent = language === 'en' ? '中文' : 'English';
        languageButton.querySelector('span').lang = language === 'en' ? 'zh-Hans' : 'en';
        languageButton.setAttribute('aria-label', language === 'en' ? '切换到中文 / Switch to Chinese' : 'Switch to English / 切换到英文');
        updateMotionLabel();
        menuButton.setAttribute('aria-label', t(menu.hidden ? 'menu_open' : 'menu_close'));
        refreshScrollLayout();
        if (announce) status.textContent = t('language_changed');
    }

    // Controls are revealed only after their event handlers are available.
    languageButton.addEventListener('click', () => {
        const header = parseFloat(getComputedStyle(root).getPropertyValue('--header-offset')) || 80;
        const marker = document.elementFromPoint(innerWidth / 2, Math.min(header + 100, innerHeight - 20))?.closest('.reveal, main > section');
        const markerTop = marker?.getBoundingClientRect().top;
        const preserveReadingPosition = scrollY > 0;
        language = language === 'en' ? 'zh' : 'en';
        save('dh-language', language);
        updateContent(true);
        if (marker && preserveReadingPosition) {
            scrollBy({ top: marker.getBoundingClientRect().top - markerTop, behavior: 'instant' });
        }
        let order = 0;
        document.querySelectorAll('.reveal').forEach(element => {
            const box = element.getBoundingClientRect();
            if (box.bottom <= header || box.top >= innerHeight) return;
            elementEffects.get(element)?.cancel();
            element.classList.add('reveal-entering');
            element.classList.remove('reveal-pending'); element.classList.add('active');
            playFeedback(element, [
                { opacity: .55, transform: 'translateY(8px)' },
                { opacity: 1, transform: getComputedStyle(element).transform }
            ], { duration: 320, delay: Math.min(order++ * 35, 105), id: 'language-change' });
        });
        playFeedback(languageButton, [
            { boxShadow: '0 0 0 0 rgba(0,242,234,.4)' },
            { boxShadow: '0 0 0 9px rgba(0,242,234,0)' }
        ], { duration: 440, id: 'language-control' });
        notifyLayout();
    });
    menuButton.addEventListener('click', () => setMenu(menu.hidden));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !menu.hidden) {
            setMenu(false);
            menuButton.focus();
        }
    });
    document.addEventListener('click', event => {
        if (!menu.hidden && !event.target.closest('nav')) setMenu(false, true);
    });
    document.addEventListener('focusin', event => {
        if (!menu.hidden && !event.target.closest('nav')) setMenu(false);
    });
    wideLayout.addEventListener('change', () => {
        if (wideLayout.matches && menu.contains(document.activeElement)) {
            document.querySelector('.desktop-nav a').focus();
        }
        setMenu(false);
    });
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', event => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const target = document.getElementById(link.getAttribute('href').slice(1));
            if (!target) return;
            event.preventDefault();
            setMenu(false);
            target.classList.remove('reveal-pending');
            target.querySelectorAll('.reveal-pending').forEach(el => { el.classList.remove('reveal-pending'); el.classList.add('active'); });
            target.focus({ preventScroll: true });
            anchorDestination = target;
            target.scrollIntoView({ behavior: motion ? 'smooth' : 'instant', block: 'start' });
            try { history.pushState(null, '', link.getAttribute('href')); } catch { /* file:// fallback */ }
            clearTimeout(anchorTimer);
            anchorTimer = setTimeout(finishAnchorFeedback, 160);
        });
    });

    function setupScrollFeedback() {
        const nav = document.querySelector('nav');
        const links = [...document.querySelectorAll('.desktop-nav a[href^="#"], #mobile-menu a[href^="#"]')];
        const sections = [...document.querySelectorAll('main > section[id]')];
        const progress = document.createElement('div');
        progress.className = 'reading-progress'; progress.setAttribute('aria-hidden', 'true');
        nav.append(progress);
        let positions = [], frame = 0, layoutFrame = 0, previousY = scrollY, current = '';
        function update() {
            frame = 0;
            const y = Math.max(0, scrollY), range = Math.max(0, document.documentElement.scrollHeight - innerHeight);
            const fraction = range ? Math.min(1, y / range) : 0;
            const header = parseFloat(getComputedStyle(root).getPropertyValue('--header-offset')) || 80;
            const line = y + header + Math.min(innerHeight * .2, 150);
            let active = positions[0]?.id || '';
            for (const section of positions) if (section.top <= line) active = section.id;
            if (range && fraction >= .995) active = positions.at(-1)?.id || active;
            progress.style.transform = `scaleX(${fraction})`;
            nav.classList.toggle('nav-scrolled', y > 24);
            if (Math.abs(y - previousY) > 1) root.dataset.scrollDirection = y > previousY ? 'down' : 'up';
            previousY = y;
            if (active !== current) {
                current = active;
                links.forEach(link => {
                    const selected = link.hash === `#${active}`;
                    link.classList.toggle('is-current', selected);
                    if (selected) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            }
        }
        const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
        refreshScrollLayout = () => {
            if (layoutFrame) return;
            layoutFrame = requestAnimationFrame(() => {
                layoutFrame = 0;
                positions = sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top + scrollY }));
                queue();
            });
        };
        window.addEventListener('scroll', () => {
            queue();
            if (anchorDestination) {
                clearTimeout(anchorTimer); anchorTimer = setTimeout(finishAnchorFeedback, 130);
            }
        }, { passive: true });
        const interruptAnchor = () => { anchorDestination = null; clearTimeout(anchorTimer); };
        window.addEventListener('wheel', interruptAnchor, { passive: true });
        window.addEventListener('touchstart', interruptAnchor, { passive: true });
        document.addEventListener('keydown', event => {
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) interruptAnchor();
        });
        document.addEventListener('scrollend', finishAnchorFeedback);
        window.addEventListener('resize', refreshScrollLayout);
        window.addEventListener('pageshow', refreshScrollLayout);
        window.addEventListener('load', refreshScrollLayout);
        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(refreshScrollLayout);
            observer.observe(document.querySelector('main')); observer.observe(document.querySelector('.nav-row'));
        }
        if (document.fonts) document.fonts.ready.then(refreshScrollLayout);
        refreshScrollLayout();
    }

    let revealObserver;
    function revealAll() {
        if (revealObserver) revealObserver.disconnect();
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.remove('reveal-pending');
            el.classList.add('active');
        });
    }
    function setupReveal() {
        if (revealObserver) revealObserver.disconnect();
        if (!motion || !('IntersectionObserver' in window)) { revealAll(); return; }
        revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const element = entry.target, box = entry.boundingClientRect;
                if (!entry.isIntersecting) {
                    const offset = translationY(element);
                    if (element.contains(document.activeElement) || (box.bottom - offset > 0 && box.top - offset < innerHeight)) return;
                    const effect = elementEffects.get(element);
                    if (effect) effect.cancel();
                    element.style.setProperty('--reveal-shift', box.bottom <= 0 ? '-24px' : '24px');
                    element.classList.remove('active'); element.classList.add('reveal-pending');
                    return;
                }
                if (!element.classList.contains('reveal-pending')) return;
                elementEffects.get(element)?.cancel();
                element.classList.add('reveal-entering');
                element.classList.remove('reveal-pending'); element.classList.add('active');
                const siblings = [...element.parentElement.children].filter(child => child.classList.contains('reveal'));
                const index = siblings.indexOf(element);
                const reverse = root.dataset.scrollDirection === 'up';
                const stagger = (reverse ? siblings.length - 1 - index : index) % 3;
                const shift = box.top < 0 ? -24 : 24;
                playFeedback(element, [
                    { opacity: 0, transform: `translateY(${shift}px)` },
                    { opacity: 1, transform: getComputedStyle(element).transform }
                ], { duration: 660, delay: Math.max(0, stagger) * 75, id: 'scroll-reveal' });
            });
        }, { threshold: 0 });
        document.querySelectorAll('.reveal').forEach(el => {
            const box = el.getBoundingClientRect();
            if ((box.top < innerHeight && box.bottom > 0) || el.contains(document.activeElement)) {
                el.classList.remove('reveal-pending'); el.classList.add('active');
            } else {
                el.style.setProperty('--reveal-shift', box.bottom <= 0 ? '-24px' : '24px');
                el.classList.remove('active'); el.classList.add('reveal-pending');
            }
            revealObserver.observe(el);
        });
    }
    document.addEventListener('focusin', event => {
        const panel = event.target.closest('.reveal');
        if (!panel) return;
        panel.classList.remove('reveal-pending'); panel.classList.add('active');
        const effect = elementEffects.get(panel);
        if (effect) effect.cancel();
        notifyLayout();
    });

    // Canvas is decorative and isolated from navigation, language and content.
    let syncCanvas = () => {};
    function setupCanvas() {
        const canvas = document.getElementById('canvas-bg');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let width = 0, height = 0, particles = [], frame = 0, last = 0;
        let textMasks = [], maskRefresh = 0;

        // Keep the original bright stars between the content, while clearing
        // only the canvas directly behind unboxed text. This changes no panel,
        // spacing or text styling. Document-space rectangles are cached after
        // layout/content changes; the animation loop never measures the DOM.
        function refreshTextMasks() {
            maskRefresh = 0;
            const masks = [], offsets = new Map();
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const range = document.createRange();
            while (walker.nextNode()) {
                const node = walker.currentNode, parent = node.parentElement;
                if (!node.textContent.trim() || !parent || parent.closest(
                    'script, style, nav, .glass-panel, .sr-only, .skip-link, [hidden], [aria-hidden="true"]'
                )) continue;
                range.selectNodeContents(node);
                // Protect the complete +/-24px entrance envelope at its
                // untransformed position, without measuring every frame.
                const reveal = parent.closest('.reveal');
                if (reveal && !offsets.has(reveal)) offsets.set(reveal, translationY(reveal));
                const offsetY = reveal ? offsets.get(reveal) : 0;
                const paddingY = reveal ? 28 : 2;
                for (const box of range.getClientRects()) {
                    if (!box.width || !box.height) continue;
                    masks.push({ x: box.left + scrollX - 2, y: box.top + scrollY - offsetY - paddingY,
                        width: box.width + 4, height: box.height + paddingY * 2 });
                }
            }
            textMasks = masks;
            if (!motion || document.hidden) draw();
        }
        function queueTextMaskRefresh() {
            if (!maskRefresh) maskRefresh = requestAnimationFrame(refreshTextMasks);
        }
        function draw(step = 0) {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx * step; p.y += p.vy * step;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
                ctx.fillStyle = 'rgba(34,211,238,.5)';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                const distanceLimit = width < 768 ? 100 : 150;
                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j], dx = p.x - q.x, dy = p.y - q.y;
                    const squared = dx * dx + dy * dy;
                    if (squared >= distanceLimit * distanceLimit) continue;
                    ctx.strokeStyle = `rgba(34,211,238,${.1 * (1 - Math.sqrt(squared) / distanceLimit)})`;
                    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                }
            }
            const offsetX = scrollX, offsetY = scrollY;
            for (const box of textMasks) {
                const top = box.y - offsetY;
                if (top + box.height < 0 || top > height) continue;
                ctx.clearRect(box.x - offsetX, top, box.width, box.height);
            }
        }
        function animate(now) {
            frame = 0;
            if (!motion || document.hidden) return;
            const step = last ? Math.min((now - last) / 16.667, 2) : 0;
            last = now; draw(step); frame = requestAnimationFrame(animate);
        }
        syncCanvas = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = 0; last = 0;
            if (motion && !document.hidden) frame = requestAnimationFrame(animate);
        };
        function resize() {
            width = innerWidth; height = innerHeight;
            const ratio = Math.min(devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            const count = Math.min(Math.ceil(width / 15), width < 768 ? 40 : 100);
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * width, y: Math.random() * height,
                vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
                size: Math.random() * 2 + 1
            }));
            refreshTextMasks(); draw(); syncCanvas();
        }
        let resizeTimer;
        window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });
        // Paused stars stay still, but the text protection follows scrolling.
        window.addEventListener('scroll', () => { if (!motion) draw(); }, { passive: true });
        document.addEventListener('transitionend', event => {
            if (event.propertyName === 'transform' && event.target.closest('.reveal')) queueTextMaskRefresh();
        });
        document.addEventListener('site:layoutchange', queueTextMaskRefresh);
        document.addEventListener('site:pagetransitionchange', queueTextMaskRefresh);
        const contentAreas = document.querySelectorAll('main, footer');
        const contentObserver = new MutationObserver(queueTextMaskRefresh);
        const sizeObserver = 'ResizeObserver' in window ? new ResizeObserver(queueTextMaskRefresh) : null;
        contentAreas.forEach(area => {
            contentObserver.observe(area, { childList: true, characterData: true, subtree: true });
            if (sizeObserver) sizeObserver.observe(area);
        });
        if (document.fonts) document.fonts.ready.then(queueTextMaskRefresh);
        document.addEventListener('visibilitychange', syncCanvas);
        resize();
    }
    function setMotion(enabled, persist = false, announce = false) {
        motion = enabled;
        root.dataset.motion = motion ? 'running' : 'paused';
        if (!motion) { cancelFeedback(); revealAll(); }
        else setupReveal();
        updateMotionLabel(); syncCanvas();
        if (persist) save('dh-motion', motion ? 'running' : 'paused');
        if (announce) status.textContent = t(motion ? 'motion_running' : 'motion_paused');
        document.dispatchEvent(new CustomEvent('site:motionchange', { detail: { enabled: motion } }));
    }
    motionButton.addEventListener('click', () => setMotion(!motion, true, true));
    reducedMotion.addEventListener('change', event => setMotion(!event.matches && read('dh-motion') !== 'paused', false, true));
    updateContent(); setMenu(false);
    root.classList.add('js');
    languageButton.hidden = false; motionButton.hidden = false; menuButton.hidden = false;
    const navRow = document.querySelector('.nav-row');
    const updateHeaderOffset = () => root.style.setProperty('--header-offset', `${Math.ceil(navRow.getBoundingClientRect().height) + 16}px`);
    updateHeaderOffset();
    if ('ResizeObserver' in window) new ResizeObserver(updateHeaderOffset).observe(navRow);
    else window.addEventListener('resize', updateHeaderOffset);
    root.dataset.motion = motion ? 'running' : 'paused';
    setupReveal();
    setupScrollFeedback();
    try { setupCanvas(); } catch { /* Decorative rendering must never hide the page. */ }
})();
