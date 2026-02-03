import { expect } from '@playwright/test';

export class EntitySetupPage {
    constructor(page) {
        this.page = page;

        // Main page elements
        this.heading_EntitySetup = page.getByRole('heading', { name: 'Entity Setup' });
        this.input_Name = page.locator('#name');
        this.input_DateFormed = page.locator('#establishmentDate');
        
        // Entity type selection
        this.option_SMSF = page.getByText('SMSF').filter({ hasText: /^SMSF$/ });
        
        // Financial year selection
        this.button_SelectPeriod = page.getByRole('button', { name: /Select period/i });
        
        // Create buttons with fallbacks
        this.button_CreateSMSF = page.getByRole('button', { name: /Create SMSF/i });
        this.button_CreateEntity = page.getByRole('button', { name: /Create Entity/i });
    }

    /**
     * Wait for the Entity Setup page to load completely
     */
    async waitForPageLoad() {
        await expect(this.heading_EntitySetup).toBeVisible();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Select SMSF as the entity type
     */
    async selectSMSFType() {
        await expect(this.option_SMSF).toBeVisible({ timeout: 30000 });
        await this.option_SMSF.click();
    }

    /**
     * Fill in the entity details form
     * @param {string} name - The name of the entity
     * @param {string} dateFormed - The date in DD/MM/YYYY format
     */
    async fillEntityDetails(name, dateFormed) {
        await expect(this.input_Name).toBeVisible();
        await this.input_Name.fill(name);

        await expect(this.input_DateFormed).toBeVisible();
        await this.input_DateFormed.fill(dateFormed);
    }

    /**
     * Select a financial year using the period selector
     * @param {number} targetYear - The target financial year
     */
    async selectFinancialYear(targetYear) {
        await this.page.waitForLoadState('networkidle');

        // Try the primary Select period button first
        const selectPeriodBtn = this.button_SelectPeriod;
        if ((await selectPeriodBtn.count()) === 0) {
            // Fallback to text match
            const altBtn = this.page.getByText(/Select\s*period/i).first();
            await expect(altBtn).toBeVisible({ timeout: 30000 });
            await altBtn.click();
        } else {
            await expect(selectPeriodBtn).toBeVisible({ timeout: 30000 });
            await selectPeriodBtn.first().click();
        }

        // Try different year format patterns
        const formats = [
            `FY ${targetYear}`,
            `FY${targetYear}`,
            `${targetYear}`,
            `${targetYear}/${(targetYear + 1).toString().slice(-2)}`,
            `${targetYear}-${(targetYear + 1).toString().slice(-2)}`
        ];

        let picked = false;
        for (const f of formats) {
            const opt = this.page.getByRole('button', { name: f });
            if ((await opt.count()) > 0) {
                await expect(opt.first()).toBeVisible({ timeout: 5000 });
                await opt.first().click();
                picked = true;
                break;
            }
            // Try text fallback
            const txt = this.page.getByText(f, { exact: true }).first();
            if ((await txt.count()) > 0) {
                await expect(txt).toBeVisible({ timeout: 5000 });
                await txt.click();
                picked = true;
                break;
            }
        }

        if (!picked) {
            // Last resort: find first matching year
            const fallback = this.page.getByText(String(targetYear)).first();
            await expect(fallback).toBeVisible({ timeout: 5000 });
            await fallback.click();
        }

        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Click the Create SMSF button and wait for creation
     * @param {string} entityName - The entity name to verify after creation
     */
    async clickCreateAndWait(entityName) {
        // Try different create button variations
        const createCandidates = [
            this.button_CreateSMSF,
            this.button_CreateEntity,
            this.page.getByRole('button', { name: /Create/i }),
            this.page.getByRole('button', { name: /Add/i })
        ];

        let createButton;
        for (const candidate of createCandidates) {
            if ((await candidate.count()) > 0) {
                createButton = candidate.first();
                break;
            }
        }

        // Fallback to any button containing Create/Add
        if (!createButton) {
            createButton = this.page.locator('button').filter({ hasText: /Create|Add/i }).first();
        }

        await expect(createButton).toBeVisible({ timeout: 30000 });

        // Wait for button to be enabled (handles async validation)
        const start = Date.now();
        while (Date.now() - start < 30000) {
            try {
                if (await createButton.isEnabled()) break;
            } catch (e) {
                // swallow and retry
            }
            await this.page.waitForTimeout(500);
        }

        await expect(createButton).toBeEnabled({ timeout: 1000 });

        // Click and wait for navigation
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
            createButton.click(),
        ]);

        // Verify creation success
        await Promise.race([
            expect(this.page.getByRole('heading', { name: /Created!/ })).toBeVisible({ timeout: 5000 }),
            expect(this.page.getByText(entityName)).toBeVisible({ timeout: 5000 })
        ]);
    }

    /**
     * Helper method to format today's date as DD/MM/YYYY
     */
    static getTodayFormatted() {
        const today = new Date();
        return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    }

    /**
     * Helper method to get the target financial year
     * Returns next year if current month is July or later
     */
    static getTargetFinancialYear() {
        const today = new Date();
        return today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear();
    }

    /**
     * Complete SMSF creation workflow
     * @param {string} entityName - Name for the new SMSF
     */
    async createSMSF(entityName = `AutoTest SMSF ${Date.now()}`) {
        await this.waitForPageLoad();
        await this.selectSMSFType();
        await this.fillEntityDetails(entityName, EntitySetupPage.getTodayFormatted());
        await this.selectFinancialYear(EntitySetupPage.getTargetFinancialYear());
        await this.clickCreateAndWait(entityName);
    }
}