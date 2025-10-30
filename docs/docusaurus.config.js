// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Orbit for Apollo Client',
  url: 'https://wassim-k.github.io',
  baseUrl: '/apollo-orbit/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.svg',
  trailingSlash: true, // required for github.io hosting

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'wassim-k', // Usually your GitHub org/user name.
  projectName: 'apollo-orbit', // Usually your repo name.

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    }
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js'
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Orbit',
        logo: {
          alt: 'Orbit',
          src: 'img/orbit.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'angular/index',
            position: 'left',
            label: 'Angular'
          },
          {
            type: 'doc',
            docId: 'react/index',
            position: 'left',
            label: 'React',
          },
          {
            href: 'https://github.com/wassim-k/apollo-orbit',
            label: 'GitHub',
            position: 'right',
          },
        ]
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: {
          ...prismThemes.dracula,
          plain: {
            ...prismThemes.dracula.plain,
            backgroundColor: '#060f2f'
          }
        },
        magicComments: [
          {
            className: 'theme-code-add',
            line: 'code-add-line',
            block: { start: 'code-add-start', end: 'code-add-end' },
          },
          {
            className: 'theme-code-remove',
            line: 'code-remove-line',
            block: { start: 'code-remove-start', end: 'code-remove-end' },
          },
        ],
      },
    }),

  plugins: [
    './plugins/generateApiTablesPlugin.ts'
  ]
};

export default config;
