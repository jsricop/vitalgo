import { test, expect } from '@playwright/test';

test.describe('Simple Patient Registration Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Patient Register → Success → Login', async ({ page }) => {
    const uniqueEmail = `simple.patient.${Date.now()}@test.com`;
    const uniqueDocument = `${Date.now()}`.slice(-8);

    // Step 1: Navigate to patient registration
    await page.getByRole('button', { name: 'Registrarse como Paciente' }).click();
    await expect(page).toHaveURL('/signup/paciente');

    // Step 2: Fill patient registration form
    await page.getByPlaceholder('Tu nombre completo').fill('Simple Patient Test');
    await page.getByPlaceholder('tu@email.com').fill(uniqueEmail);
    await page.getByPlaceholder('••••••••').first().fill('SimpleTest123!');
    await page.getByPlaceholder('••••••••').last().fill('SimpleTest123!');
    await page.getByPlaceholder('3001234567').fill('3001234567');

    // Step 3: Fill medical profile (part of registration form)
    await page.selectOption('[name="tipoDocumento"]', 'CC');
    await page.getByPlaceholder('1234567890').fill(uniqueDocument);
    await page.locator('[name="fechaNacimiento"]').fill('1990-01-15');
    await page.selectOption('[name="tipoSangre"]', 'O+');
    
    // Select EPS properly from dropdown
    await page.getByPlaceholder('Busca tu EPS...').fill('SURA');
    await page.waitForTimeout(1500); // Wait for EPS dropdown to populate
    
    // Look for SURA in the dropdown and click it
    const suraOption = page.locator('text=SURA').first();
    if (await suraOption.isVisible()) {
      await suraOption.click();
    } else {
      // If SURA not found, select the first EPS option available
      const firstEpsOption = page.locator('[role="option"], [data-value], .eps-option').first();
      if (await firstEpsOption.isVisible()) {
        await firstEpsOption.click();
      }
    }

    // Step 4: Submit registration
    console.log('About to click Registrarse button...');
    await page.waitForTimeout(2000); // Allow form validation to settle
    
    // Check if there are any validation errors first
    const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red-500, .text-red-600').all();
    if (errorElements.length > 0) {
      console.log(`Found ${errorElements.length} validation errors:`);
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log(`Error ${i + 1}: ${errorText}`);
      }
    }
    
    // Get current URL before clicking
    console.log(`URL before submit: ${page.url()}`);
    
    await page.getByRole('button', { name: 'Registrarse' }).click();
    
    // Step 5: Wait and check what happens immediately after click
    console.log('Clicked Registrarse button, waiting for response...');
    await page.waitForTimeout(3000); // Wait for any modal/redirect
    
    // Check URL to see where we ended up
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Take a screenshot to see what's on screen
    await page.screenshot({ path: 'registration-result.png', fullPage: true });
    
    // Look for any success indicators
    const possibleSuccessTexts = [
      '¡Registro Exitoso!', 
      'Registro exitoso', 
      'registro exitoso',
      'Bienvenido',
      'Completar Perfil',
      'Dashboard'
    ];
    
    let foundSuccess = false;
    for (const text of possibleSuccessTexts) {
      try {
        await expect(page.getByText(text)).toBeVisible({ timeout: 2000 });
        console.log(`Found success text: "${text}"`);
        foundSuccess = true;
        break;
      } catch (e) {
        console.log(`Text "${text}" not found`);
      }
    }
    
    // If we found success modal, try to continue
    if (foundSuccess && page.url().includes('/signup')) {
      // Look for continue button
      try {
        await page.getByRole('button', { name: 'Completar Perfil Médico' }).click();
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('No "Completar Perfil Médico" button found');
      }
      
      try {
        await page.getByRole('button', { name: 'Ir al Login' }).click();
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('No "Ir al Login" button found');
      }
    }
    
    // Step 6: Verify we can login with the new user
    if (!page.url().includes('/login')) {
      await page.goto('/login');
    }
    
    await page.getByPlaceholder('tu@email.com').fill(uniqueEmail);
    await page.getByPlaceholder('••••••••').fill('SimpleTest123!');
    await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).last().click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Bienvenido')).toBeVisible();
  });
});