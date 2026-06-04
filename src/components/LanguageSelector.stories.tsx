import type { Meta, StoryObj } from '@storybook/react';
import LanguageSelector from './LanguageSelector';

const meta: Meta<typeof LanguageSelector> = {
  title: 'Components/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof LanguageSelector>;

export const Default: Story = {};
