import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Ya tengo cuenta - Iniciar sesión' }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Bienvenido de vuelta')).toBeVisible();
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).last().click();
    
    // Check for validation messages
    await expect(page.getByText('El email es requerido')).toBeVisible();
    await expect(page.getByText('La contraseña es requerida')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill('invalid@test.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).last().click();
    
    // Wait for error message
    await expect(page.getByText('Email o contraseña incorrectos. Inténtalo de nuevo.')).toBeVisible();
  });

  test('should redirect to dashboard after successful patient login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill('playwright.test@vitalgo.app');
    await page.getByPlaceholder('••••••••').fill('TestPass123!');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).last().click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Bienvenido')).toBeVisible();
  });

  test('should redirect to admin dashboard after admin login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill('admin@vitalgo.app');
    await page.getByPlaceholder('••••••••').fill('VitalGo2024!');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).last().click();
    
    // Should redirect to admin dashboard  
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Bienvenido')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill('playwright.test@vitalgo.app');
    await page.getByPlaceholder('••••••••').fill('TestPass123!');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).last().click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Ya tengo cuenta - Iniciar sesión')).toBeVisible();
  });

  test('should navigate to patient registration', async ({ page }) => {
    await page.getByRole('button', { name: 'Registrarse como Paciente' }).click();
    
    await expect(page).toHaveURL('/signup/paciente');
    await expect(page.getByText('Registro de Paciente')).toBeVisible();
    await expect(page.getByPlaceholder('Nombres')).toBeVisible();
    await expect(page.getByPlaceholder('Apellidos')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
  });

  test('should navigate to paramedic registration', async ({ page }) => {
    await page.getByRole('button', { name: 'Registrarse como Profesional' }).click();
    
    await expect(page).toHaveURL('/signup/paramedico');
    await expect(page.getByText('Registro de Paramédico')).toBeVisible();
    await expect(page.getByPlaceholder('Nombres')).toBeVisible();
    await expect(page.getByPlaceholder('Número de Licencia')).toBeVisible();
  });
});