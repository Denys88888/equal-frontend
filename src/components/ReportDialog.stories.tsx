import type { Meta, StoryObj } from '@storybook/react';
import ReportDialog from './ReportDialog';

const meta: Meta<typeof ReportDialog> = {
  title: 'Components/ReportDialog',
  component: ReportDialog,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof ReportDialog>;

export const Default: Story = {
  args: {
    isOpen: true,
    targetName: 'Jane Doe',
  },
};
