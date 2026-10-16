/* Titanium Motion — choreography for the existing page.
   This file only marks existing content. Navigation, text, media and controls stay intact. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || main.dataset.tsmMapped === 'yes') return;
  main.dataset.tsmMapped = 'yes';

  const motionSelector = '[data-tsm-reveal],[data-tsm-kinetic]';
  function reveal(element, direction = 'up', delay = 0) {
    if (!element || element.closest('dialog,header,.music-widget,.style-controls,.nt-gallery')) return;
    // Magnetic controls keep their own transform; their surrounding group can enter instead.
    if (element.matches('.button,.explore-trigger,.closing-explore')) return;
    // The existing outer shell owns scroll motion; its inner card owns pointer/sensor tilt.
    if (element.matches('.tilt-card')) element = element.closest('.tilt-shell');
    if (!element || element.parentElement?.closest(motionSelector)) return;
    if (element.matches('[data-tsm-kinetic]') || element.querySelector('[data-tsm-kinetic]')) return;
    element.setAttribute('data-tsm-reveal', direction);
    element.style.setProperty('--stagger', `${Math.min(320, Math.max(0, delay))}ms`);
  }
  function markTextRuns(heading, delay = 0) {
    if (!heading || heading.querySelector('[data-tsm-kinetic]')) return;
    if (heading.matches('h1,h2') && !heading.hasAttribute('aria-label')) {
      const readable = heading.cloneNode(true);
      readable.querySelectorAll('br').forEach(br => br.replaceWith(' '));
      heading.setAttribute('aria-label', readable.textContent.replace(/\s+/g, ' ').trim());
    }
    const nodes = [];
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim() && !node.parentElement.closest('button,a,code,[data-tsm-kinetic],.tsm-sweep')) nodes.push(node);
    }
    nodes.forEach(text => {
      // A custom inline element preserves existing h2 > span color/gradient selectors and <br>s.
      const copy = document.createElement('tsm-text');
      copy.className = 'tsm-copy';
      copy.setAttribute('data-tsm-kinetic', '');
      copy.setAttribute('aria-hidden', 'true');
      copy.style.setProperty('--stagger', `${Math.min(320, delay)}ms`);
      text.replaceWith(copy);
      copy.append(text);
    });
  }

  // Name and section headings resolve in readable word groups, without rebuilding their markup.
  main.querySelectorAll('h2').forEach(heading => markTextRuns(heading));
  markTextRuns(main.querySelector('.name-first'), 80);
  markTextRuns(main.querySelector('.dev-name'), 140);

  const hero = main.querySelector('.hero');
  if (hero) {
    reveal(hero.querySelector('.hero-copy > .eyebrow'), 'soft');
    reveal(hero.querySelector('.hero-greeting'), 'soft', 60);
    reveal(hero.querySelector('.role'), 'up', 140);
    reveal(hero.querySelector('.hero-description'), 'up', 180);
    reveal(hero.querySelector('.hero-actions'), 'up', 240);
    reveal(hero.querySelector('.hero-socials'), 'soft', 280);
    reveal(hero.querySelector('.hero-bottom'), 'soft', 320);
    reveal(hero.querySelector('.nt-hero-scene')?.closest('.tilt-shell'), 'hero', 160);
    reveal(hero.querySelector('.site-tools'), 'up', 280);
    hero.setAttribute('data-tsm-depth', 'hero');
  }

  // Headings animate their own text; large containers do not move their animated children twice.
  main.querySelectorAll('.reveal').forEach(element => {
    if (element.hasAttribute('data-tsm-reveal')) return;
    if (element.matches('h1,h2,.section-heading,.about-content,.about-statement,.journey-intro,.contact-copy,.donate-panel')) return;
    if (element.querySelector('h1,h2,[data-tsm-kinetic]')) return;
    reveal(element, 'up');
  });
  main.querySelectorAll('.eyebrow,.nt-gallery-note,.about-overline').forEach(element => {
    if (!element.hasAttribute('data-tsm-reveal')) reveal(element, 'soft');
  });
  main.querySelectorAll('.about-content > p,.about-statement > p,.about-text-link,.about-pills,.journey-intro > p:not(.eyebrow),.contact-copy > p:not(.eyebrow),.contact-email,.donate-copy > p:not(.eyebrow),.bank-details,.amount-form,.donate-copy > .hero-actions,.closing-scene > p:not(.eyebrow)').forEach(element => reveal(element, 'up', 80));
  main.querySelectorAll('.split-heading > p,.nt-gallery-actions,.nt-gallery-footer').forEach(element => reveal(element, 'soft', 120));
  main.querySelectorAll('.qr-panel').forEach(element => reveal(element, 'right', 160));
  main.querySelectorAll('#contact-form,.code-workbench').forEach(element => reveal(element, 'scale', 120));
  main.querySelectorAll('.closing-scene > .button,.closing-explore').forEach(element => reveal(element, 'soft', 160));
  main.querySelector('.closing-scene')?.setAttribute('data-tsm-depth', 'closing');
  reveal(main.querySelector('.tech-strip'), 'soft');

  main.querySelectorAll('.skills-grid,.projects-grid,.social-grid,.life-grid,.timeline').forEach(group => {
    [...group.children].forEach((element, index) => {
      const direction = group.matches('.projects-grid') ? (index % 2 ? 'right' : 'left') : 'up';
      reveal(element, direction, index * 105);
    });
  });
  document.querySelectorAll('.footer > *').forEach((element, index) => reveal(element, 'soft', index * 80));

  // Reuse the old divider/underline positions. These decorative layers reserve no new space.
  main.querySelectorAll('.section-heading h2').forEach(heading => {
    heading.classList.add('tsm-heading-sweep');
    if (heading.querySelector('.tsm-sweep')) return;
    const sweep = document.createElement('span');
    sweep.className = 'tsm-sweep';
    sweep.setAttribute('aria-hidden', 'true');
    heading.append(sweep);
  });
  main.querySelectorAll('.section').forEach(section => {
    section.classList.add('tsm-section');
    if ([...section.children].some(child => child.classList.contains('tsm-drawline'))) return;
    const line = document.createElement('span');
    line.className = 'tsm-drawline';
    line.setAttribute('data-tsm-line', '');
    line.setAttribute('aria-hidden', 'true');
    section.append(line);
  });
  main.querySelectorAll('.skill-card .progress').forEach(bar => bar.classList.add('tsm-meter'));
  if (!document.querySelector('.tsm-scroll-progress')) {
    const progress = document.createElement('div');
    progress.className = 'tsm-scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.append(document.createElement('span'));
    document.body.append(progress);
  }
})();
