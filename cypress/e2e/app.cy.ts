describe('Drugstore App Navigation', () => {
  it('should navigate to the home page', () => {
    cy.visit('/')
    // Assuming there's some text on the home page, e.g., "PharmaCare" or similar
    cy.contains('PharmaCare').should('exist')
  })

  it('should navigate to the login page', () => {
    cy.visit('/auth/login')
    cy.contains('Login').should('exist')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
  })

  it('should allow a user to log in', () => {
    cy.visit('/auth/login')
    
    // Use the admin credentials we created earlier or test user
    cy.get('input[type="email"]').type('admin@drugstore.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()

    // Should redirect to dashboard or show dashboard content
    cy.url().should('include', '/dashboard')
    cy.contains('Dashboard').should('exist')
  })
})

describe('Sales Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/auth/login')
    cy.get('input[type="email"]').type('admin@drugstore.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should navigate to sales page', () => {
    cy.visit('/sales/new')
    cy.contains('New Sale').should('exist')
    cy.contains('Product Search').should('exist')
  })

  it('should search for a product', () => {
    cy.visit('/sales/new')
    cy.get('input[placeholder*="Search"]').type('Dipirona')
    cy.contains('Dipirona').should('exist')
  })
})
