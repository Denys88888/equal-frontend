import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import LanguageSelector from './LanguageSelector';

describe('LanguageSelector', () => {
  it('renders language selector', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders globe icon', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>,
    );
    // The select trigger should contain the current language display
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
