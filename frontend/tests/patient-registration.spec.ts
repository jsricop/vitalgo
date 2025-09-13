import { test, expect } from '@playwright/test';

test.describe('Patient Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup/paciente');
  });

  test('should display patient registration form', async ({ page }) => {
    await expect(page.getByText('Registro de Paciente')).toBeVisible();
    await expect(page.getByPlaceholder('Nombres')).toBeVisible();
    await expect(page.getByPlaceholder('Apellidos')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Contraseña')).toBeVisible();
    await expect(page.getByPlaceholder('Confirmar contraseña')).toBeVisible();
    await expect(page.getByPlaceholder('Teléfono')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Registrarse' }).click();
    
    await expect(page.getByText('Los nombres son requeridos')).toBeVisible();
    await expect(page.getByText('Los apellidos son requeridos')).toBeVisible();
    await expect(page.getByText('El email es requerido')).toBeVisible();
    await expect(page.getByText('La contraseña es requerida')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('invalid-email');
    await page.getByRole('button', { name: 'Registrarse' }).click();
    
    await expect(page.getByText('Formato de email inválido')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.getByPlaceholder('Contraseña').fill('TestPass123!');
    await page.getByPlaceholder('Confirmar contraseña').fill('DifferentPass123!');
    await page.getByRole('button', { name: 'Registrarse' }).click();
    
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
  });

  test('should show error for existing email', async ({ page }) => {
    await page.getByPlaceholder('Nombres').fill('Test');
    await page.getByPlaceholder('Apellidos').fill('User');
    await page.getByPlaceholder('Email').fill('test.patient@vitalgo.app'); // Existing user
    await page.getByPlaceholder('Contraseña').fill('TestPass123!');
    await page.getByPlaceholder('Confirmar contraseña').fill('TestPass123!');
    await page.getByPlaceholder('Teléfono').fill('3001234567');
    
    await page.getByRole('button', { name: 'Registrarse' }).click();
    
    await expect(page.getByText('El email ya está registrado')).toBeVisible();
  });

  test('should successfully register new patient', async ({ page }) => {
    const uniqueEmail = `new.patient.${Date.now()}@test.com`;
    
    await page.getByPlaceholder('Nombres').fill('Nuevo');
    await page.getByPlaceholder('Apellidos').fill('Paciente');
    await page.getByPlaceholder('Email').fill(uniqueEmail);
    await page.getByPlaceholder('Contraseña').fill('NewPass123!');
    await page.getByPlaceholder('Confirmar contraseña').fill('NewPass123!');
    await page.getByPlaceholder('Teléfono').fill('3009876543');
    
    await page.getByRole('button', { name: 'Registrarse' }).click();
    
    // Should redirect to complete medical profile
    await expect(page).toHaveURL('/complete-medical-profile');
    await expect(page.getByText('Completar Perfil Médico')).toBeVisible();
  });

  test('should complete medical profile after registration', async ({ page }) => {
    // First register a new patient
    const uniqueEmail = `profile.patient.${Date.now()}@test.com`;
    
    await page.getByPlaceholder('Nombres').fill('Perfil');
    await page.getByPlaceholder('Apellidos').fill('Paciente');
    await page.getByPlaceholder('Email').fill(uniqueEmail);
    await page.getByPlaceholder('Contraseña').fill('ProfilePass123!');
    await page.getByPlaceholder('Confirmar contraseña').fill('ProfilePass123!');
    await page.getByPlaceholder('Teléfono').fill('3007654321');
    
    await page.getByRole('button', { name: 'Registrarse' }).click();
    
    // Now on medical profile page
    await expect(page).toHaveURL('/complete-medical-profile');
    
    // Fill medical profile
    await page.selectOption('[name="documentType"]', 'CC');
    await page.getByPlaceholder('Número de documento').fill('12345678');
    await page.getByPlaceholder('Fecha de nacimiento').fill('1990-01-15');
    await page.selectOption('[name="gender"]', 'M');
    await page.selectOption('[name="bloodType"]', 'O+');
    await page.getByPlaceholder('Nombre del contacto de emergencia').fill('Juan Pérez');
    await page.getByPlaceholder('Teléfono del contacto').fill('3001111111');
    await page.getByPlaceholder('Dirección').fill('Calle 123 #45-67');
    await page.getByPlaceholder('Ciudad').fill('Bogotá');
    
    // Select EPS
    await page.selectOption('[name="eps"]', { label: 'SURA' });
    
    await page.getByRole('button', { name: 'Completar Perfil' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Bienvenido')).toBeVisible();
  });

  test('should navigate back to login', async ({ page }) => {
    await page.getByText('¿Ya tienes cuenta? Inicia sesión').click();
    
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Bienvenido a VitalGo')).toBeVisible();
  });
});