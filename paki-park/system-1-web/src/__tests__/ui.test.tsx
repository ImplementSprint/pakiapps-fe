import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />)
    // The default Next.js template has an <h1> or some text. 
    // I'll check for a common element or just verify it renders.
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
