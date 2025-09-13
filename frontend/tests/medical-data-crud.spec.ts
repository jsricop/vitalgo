import { test, expect } from '@playwright/test';

test.describe('Medical Data CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test patient before each test
    await page.goto('/login');
    await page.getByPlaceholder('tu@email.com').fill('playwright.test@vitalgo.app');
    await page.getByPlaceholder('••••••••').fill('TestPass123!');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).last().click();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Allergies Management', () => {
    test('should navigate to allergies page', async ({ page }) => {
      await page.getByText('Alergias').click();
      
      await expect(page).toHaveURL('/medical-info/alergias');
      await expect(page.getByText('Gestión de Alergias')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Agregar Alergia' })).toBeVisible();
    });

    test('should add new allergy', async ({ page }) => {
      await page.goto('/medical-info/alergias');
      
      await page.getByRole('button', { name: 'Agregar Alergia' }).click();
      
      // Fill allergy form
      await page.getByPlaceholder('Nombre del alérgeno').fill('Penicilina');
      await page.selectOption('[name="severity"]', 'high');
      await page.getByPlaceholder('Síntomas').fill('Erupción cutánea, dificultad respiratoria');
      await page.getByPlaceholder('Tratamiento').fill('Evitar medicamentos con penicilina');
      await page.getByPlaceholder('Fecha de diagnóstico').fill('2023-01-15');
      await page.getByPlaceholder('Notas adicionales').fill('Diagnosticado en Hospital San Juan');
      
      await page.getByRole('button', { name: 'Guardar Alergia' }).click();
      
      // Verify allergy was added
      await expect(page.getByText('Alergia agregada exitosamente')).toBeVisible();
      await expect(page.getByText('Penicilina')).toBeVisible();
      await expect(page.getByText('Alta')).toBeVisible();
    });

    test('should edit existing allergy', async ({ page }) => {
      await page.goto('/medical-info/alergias');
      
      // Click edit button on first allergy
      await page.getByRole('button', { name: 'Editar' }).first().click();
      
      // Update allergy information
      await page.getByPlaceholder('Síntomas').clear();
      await page.getByPlaceholder('Síntomas').fill('Síntomas actualizados');
      
      await page.getByRole('button', { name: 'Actualizar Alergia' }).click();
      
      // Verify update
      await expect(page.getByText('Alergia actualizada exitosamente')).toBeVisible();
      await expect(page.getByText('Síntomas actualizados')).toBeVisible();
    });

    test('should delete allergy', async ({ page }) => {
      await page.goto('/medical-info/alergias');
      
      // Get the text of the first allergy to verify deletion
      const allergyText = await page.locator('.allergy-item').first().textContent();
      
      // Click delete button
      await page.getByRole('button', { name: 'Eliminar' }).first().click();
      
      // Confirm deletion
      await page.getByRole('button', { name: 'Confirmar' }).click();
      
      // Verify deletion
      await expect(page.getByText('Alergia eliminada exitosamente')).toBeVisible();
      if (allergyText) {
        await expect(page.getByText(allergyText)).not.toBeVisible();
      }
    });
  });

  test.describe('Illnesses Management', () => {
    test('should navigate to illnesses page', async ({ page }) => {
      await page.getByText('Enfermedades').click();
      
      await expect(page).toHaveURL('/medical-info/enfermedades');
      await expect(page.getByText('Gestión de Enfermedades')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Agregar Enfermedad' })).toBeVisible();
    });

    test('should add new illness', async ({ page }) => {
      await page.goto('/medical-info/enfermedades');
      
      await page.getByRole('button', { name: 'Agregar Enfermedad' }).click();
      
      // Fill illness form
      await page.getByPlaceholder('Nombre de la enfermedad').fill('Diabetes Tipo 2');
      await page.getByPlaceholder('Código CIE-10').fill('E11');
      await page.getByPlaceholder('Fecha de diagnóstico').fill('2022-06-15');
      await page.selectOption('[name="status"]', 'CONTROLADA');
      await page.getByPlaceholder('Síntomas').fill('Sed excesiva, visión borrosa');
      await page.getByPlaceholder('Tratamiento').fill('Metformina 500mg, dieta controlada');
      await page.getByPlaceholder('Prescrito por').fill('Dr. María González');
      await page.check('[name="is_chronic"]');
      
      await page.getByRole('button', { name: 'Guardar Enfermedad' }).click();
      
      // Verify illness was added
      await expect(page.getByText('Enfermedad agregada exitosamente')).toBeVisible();
      await expect(page.getByText('Diabetes Tipo 2')).toBeVisible();
      await expect(page.getByText('CONTROLADA')).toBeVisible();
    });

    test('should edit existing illness', async ({ page }) => {
      await page.goto('/medical-info/enfermedades');
      
      // Click edit button on first illness
      await page.getByRole('button', { name: 'Editar' }).first().click();
      
      // Update illness status
      await page.selectOption('[name="status"]', 'ACTIVA');
      await page.getByPlaceholder('Tratamiento').clear();
      await page.getByPlaceholder('Tratamiento').fill('Tratamiento actualizado');
      
      await page.getByRole('button', { name: 'Actualizar Enfermedad' }).click();
      
      // Verify update
      await expect(page.getByText('Enfermedad actualizada exitosamente')).toBeVisible();
      await expect(page.getByText('ACTIVA')).toBeVisible();
    });
  });

  test.describe('Surgeries Management', () => {
    test('should navigate to surgeries page', async ({ page }) => {
      await page.getByText('Cirugías').click();
      
      await expect(page).toHaveURL('/medical-info/cirugias');
      await expect(page.getByText('Gestión de Cirugías')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Agregar Cirugía' })).toBeVisible();
    });

    test('should add new surgery', async ({ page }) => {
      await page.goto('/medical-info/cirugias');
      
      await page.getByRole('button', { name: 'Agregar Cirugía' }).click();
      
      // Fill surgery form
      await page.getByPlaceholder('Nombre de la cirugía').fill('Apendicectomía');
      await page.getByPlaceholder('Fecha de cirugía').fill('2023-03-20');
      await page.getByPlaceholder('Cirujano').fill('Dr. Carlos Rodríguez');
      await page.getByPlaceholder('Hospital').fill('Hospital Nacional');
      await page.getByPlaceholder('Descripción').fill('Extracción del apéndice por apendicitis aguda');
      await page.getByPlaceholder('Diagnóstico').fill('Apendicitis aguda');
      await page.getByPlaceholder('Tipo de anestesia').fill('General');
      await page.getByPlaceholder('Duración (minutos)').fill('45');
      
      await page.getByRole('button', { name: 'Guardar Cirugía' }).click();
      
      // Verify surgery was added
      await expect(page.getByText('Cirugía agregada exitosamente')).toBeVisible();
      await expect(page.getByText('Apendicectomía')).toBeVisible();
      await expect(page.getByText('Dr. Carlos Rodríguez')).toBeVisible();
    });

    test('should edit existing surgery', async ({ page }) => {
      await page.goto('/medical-info/cirugias');
      
      // Click edit button on first surgery
      await page.getByRole('button', { name: 'Editar' }).first().click();
      
      // Update surgery information
      await page.getByPlaceholder('Descripción').clear();
      await page.getByPlaceholder('Descripción').fill('Descripción actualizada de la cirugía');
      
      await page.getByRole('button', { name: 'Actualizar Cirugía' }).click();
      
      // Verify update
      await expect(page.getByText('Cirugía actualizada exitosamente')).toBeVisible();
      await expect(page.getByText('Descripción actualizada de la cirugía')).toBeVisible();
    });
  });

  test.describe('QR Code Generation', () => {
    test('should navigate to QR code page', async ({ page }) => {
      await page.getByText('Mi Código QR').click();
      
      await expect(page).toHaveURL('/qr-code');
      await expect(page.getByText('Tu Código QR Médico')).toBeVisible();
    });

    test('should display QR code', async ({ page }) => {
      await page.goto('/qr-code');
      
      // Check if QR code image is displayed
      await expect(page.locator('img[alt="QR Code"]')).toBeVisible();
      await expect(page.getByText('Código de emergencia')).toBeVisible();
      
      // Check for download/print buttons
      await expect(page.getByRole('button', { name: 'Descargar QR' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Imprimir QR' })).toBeVisible();
    });

    test('should regenerate QR code', async ({ page }) => {
      await page.goto('/qr-code');
      
      // Get current QR code src
      const currentQRSrc = await page.locator('img[alt="QR Code"]').getAttribute('src');
      
      // Regenerate QR code
      await page.getByRole('button', { name: 'Regenerar QR' }).click();
      
      // Verify QR code was regenerated
      await expect(page.getByText('Código QR regenerado exitosamente')).toBeVisible();
      
      // Check if QR code src changed
      const newQRSrc = await page.locator('img[alt="QR Code"]').getAttribute('src');
      expect(newQRSrc).not.toBe(currentQRSrc);
    });
  });
});