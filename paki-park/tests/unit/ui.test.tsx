import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '../../src/app/layout';

/**
 * PakiPark UI smoke tests.
 * These tests verify the Next.js root layout and metadata exported from
 * src/Frontend/src/app/layout.tsx are correctly configured.
 */
describe('PakiPark-UI', () => {
  it('exports correct page title metadata', () => {
    expect(metadata.title).toBe('PakiPark — Smart Parking Reservation');
  });

  it('exports correct page description metadata', () => {
    expect(metadata.description).toContain('PakiPark');
  });

  it('creates root layout with html lang="en"', () => {
    const element = RootLayout({ children: <main>content</main> });
    expect(element.props.lang).toBe('en');
  });
});
