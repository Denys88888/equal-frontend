import type { Meta, StoryObj } from '@storybook/react';
import SkeletonLoader from './SkeletonLoader';

const meta: Meta<typeof SkeletonLoader> = {
  title: 'Components/SkeletonLoader',
  component: SkeletonLoader,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonLoader>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
