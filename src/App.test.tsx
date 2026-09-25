import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders correctly in the happy-dom environment', () => {
    window.history.pushState({}, 'DevLib', '/devlib')
    render(<App />)

    // Validates that happy-dom and @testing-library/jest-dom matchers work properly
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/Vitrine de Componentes/i)).toBeInTheDocument()
  })

  it('validates test environment globals and DOM availability', () => {
    expect(window).toBeDefined()
    expect(document.body).toBeDefined()
  })
})
