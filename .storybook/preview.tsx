import type { Preview } from '@storybook/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n/config';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'linen',
      values: [
        { name: 'linen', value: '#F7F4EE' },
        { name: 'dark', value: '#232323' },
        { name: 'white', value: '#FFFFFF' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          <Story />
        </div>
      </I18nextProvider>
    ),
  ],
};

export default preview;
