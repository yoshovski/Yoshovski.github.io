/**
 * content.js
 * Populates the static page (text, links, meta tags) from config.js so
 * that config.js stays the single file you edit. Runs once on load.
 */

import { config } from './config.js';

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function applyContent() {
  // Document + SEO / social preview
  document.title = config.seo.title;
  setMeta('meta[name="description"]', 'content', config.seo.description);
  setMeta('meta[property="og:title"]', 'content', config.seo.title);
  setMeta('meta[property="og:description"]', 'content', config.seo.description);
  setMeta('meta[property="og:url"]', 'content', config.seo.url);
  setMeta('meta[property="og:image"]', 'content', config.seo.image);

  // About section (book)
  const aboutHeading = document.querySelector('.section--about h1');
  if (aboutHeading) aboutHeading.textContent = config.name;

  const aboutSection = document.querySelector('.section--about');
  if (aboutSection) {
    aboutSection.querySelectorAll('p').forEach((p) => p.remove());
    config.about.forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text.replace(/\s+/g, ' ').trim();
      aboutSection.appendChild(p);
    });
  }

  // Contact email
  const emailLink = document.getElementById('contact-email');
  if (emailLink) {
    emailLink.href = `mailto:${config.email}`;
    const span = emailLink.querySelector('span');
    if (span) span.textContent = config.email;
  }

  // Social links
  const socialMap = {
    github: '[data-social="github"]',
    instagram: '[data-social="instagram"]',
    linkedin: '[data-social="linkedin"]',
  };
  Object.entries(socialMap).forEach(([key, selector]) => {
    const el = document.querySelector(selector);
    if (el && config.socials[key]) el.href = config.socials[key];
  });

  // Audio onboarding hint
  const hintText = document.querySelector('#audio-hint .audio-hint__text');
  if (hintText) hintText.textContent = config.audioHint;

  // Footer
  const footer = document.querySelector('footer');
  if (footer) footer.textContent = `${new Date().getFullYear()} portfolio - ${config.name}`;
}
