import { render, screen } from '@testing-library/react';
import App from '../src/App';
import Page from '../src/app/page';
import RootLayout, { metadata } from '../src/app/layout';

describe('System-2-Web', () => {
  it('renders application title', () => {
    render(<App />);
    expect(screen.getByText('System 2 Web')).toBeInTheDocument();
  });

  it('renders page wrapper content', () => {
    render(<Page />);
    expect(screen.getByText('System 2 Web')).toBeInTheDocument();
  });

  it('exports expected metadata', () => {
    expect(metadata.title).toBe('System 2 Web');
    expect(metadata.description).toBe('System 2 starter app');
  });

  it('creates root layout with html lang and body children', () => {
    const element = RootLayout({ children: <main>content</main> });
    expect(element.props.lang).toBe('en');

    const bodyElement = element.props.children;
    expect(bodyElement.type).toBe('body');
    expect(bodyElement.props.children.props.children).toBe('content');
  });
});
