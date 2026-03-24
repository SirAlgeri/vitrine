// Suprimir erros de uncaught exceptions do app (React, etc)
Cypress.on('uncaught:exception', () => false);
