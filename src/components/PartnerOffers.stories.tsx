import type { Meta, StoryObj } from '@storybook/react';
import PartnerOffers from './PartnerOffers';

const meta: Meta<typeof PartnerOffers> = {
  title: 'Components/PartnerOffers',
  component: PartnerOffers,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof PartnerOffers>;

export const Default: Story = {};

export const Dismissible: Story = {
  args: {
    onDismiss: () => console.log('dismissed'),
  },
};
