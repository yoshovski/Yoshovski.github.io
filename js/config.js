/**
 * config.js — SINGLE SOURCE OF TRUTH
 * =================================================================
 * This is the only file you need to edit to personalise the portfolio.
 * Change your name, links, projects, the YouTube video and the book
 * cover here — everything else (the page, the 3D room, the meta tags)
 * reads from this object.
 * =================================================================
 */

export const config = {
  // ── Identity ───────────────────────────────────────────────────
  name: 'Stefan Yoshovski',
  role: 'Software Developer based in Valencia',

  // Big stylised name on the 3D wall + the line under it.
  wallTitle: 'STEFKO YOSHOVSKI',
  wallSubtitle: 'Videomaker / Developer / Photographer',

  // About-me paragraphs (shown when the book is opened).
  about: [
    `Hello, I'm Stefan Yoshovski, a software designer and computer science engineer with
     a passion for building scalable and efficient software solutions. My expertise spans
     backend and frontend development, with a strong focus on Java, Spring Boot, SQL (Oracle),
     and Angular. I enjoy working on complex system architectures, enterprise applications,
     and integrations that enhance functionality and performance.`,
    `Beyond software development, I have a deep interest in smart home automation, IoT, and
     emerging technologies like augmented reality. I work on innovative projects that bridge
     technology and usability. Additionally, I'm passionate about photography and drone
     videography, always exploring new ways to capture and present the world creatively.`,
    `I'm always open to discussing technology, research, and creative collaborations.
     Feel free to reach out if you have any questions or ideas!`,
  ],

  // ── Contact ────────────────────────────────────────────────────
  email: 'info@yoshovski.it',
  socials: {
    github: 'https://github.com/yoshovski',
    instagram: 'https://www.instagram.com/stefanyoshovski.ph',
    linkedin: 'https://www.linkedin.com/in/stefan-yoshovski/?locale=en_US',
  },

  // ── Interactive 3D bits ────────────────────────────────────────
  // Clicking the monitor/screen opens this link in a new tab.
  youtubeUrl: 'https://www.youtube.com/watch?v=Q-6Z_GBztWg',

  // Book cover. Leave null to keep the cover baked into the 3D model
  // (your CV). To use your own image instead, drop it in /images and set
  // the path here, e.g. 'images/my-cover.jpg' — no model re-export needed.
  coverImage: null,

  // Onboarding hint shown on load to nudge visitors to enable sound.
  audioHint: 'Click the speaker to hear the room',

  // Seconds after load before the drone takes off on its own.
  droneAutoFlyDelay: 4,

  // ── Projects (the photo wall) ──────────────────────────────────
  // Add / remove freely — they auto-arrange in a 3-per-row grid.
  projects: [
    {
      image: 'textures/project-colorpop.jpg',
      url: 'https://github.com/Copelli-Yoshovski-Associates/ColorPop_AI_Project',
    },
    {
      image: 'textures/project-java-app.jpg',
      url: 'https://github.com/yoshovski/store-management-software-unical',
    },
    {
      image: 'textures/project-siliconsquare.jpg',
      url: 'https://github.com/Silicon-Square/SiliconSquare',
    },
    {
      image: 'textures/project-sorting.jpg',
      url: 'https://github.com/Copelli-Yoshovski-Associates/Parallel-Sorting-Algorithms-MPI',
    },
    {
      image: 'textures/project-thesis.jpg',
      url: 'https://github.com/yoshovski/Thesis-ASP-Based-System-For-Humanitarian-Assistance',
    },
    {
      image: 'textures/project-wordpress-plugin.jpg',
      url: 'https://github.com/yoshovski/world-domi-map',
    },
  ],

  // ── SEO / social preview ───────────────────────────────────────
  seo: {
    title: 'Stefan Yoshovski - Software Developer based in Valencia',
    description:
      "Hello, I'm Stefan Yoshovski, a software designer and computer science engineer with a " +
      'passion for building scalable and efficient software solutions. My expertise spans backend ' +
      'and frontend development, with a strong focus on Java, Spring Boot, SQL (Oracle), and Angular.',
    url: 'https://github.com/yoshovski',
    image: '/images/preview.jpg',
  },
};
