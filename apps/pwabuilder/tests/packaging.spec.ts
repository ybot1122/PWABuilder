import { test, expect, Page } from '@playwright/test';

const v8toIstanbul = require('v8-to-istanbul');

let currentPage: Page | undefined;

const url = 'http://localhost:3000';
// before each test
test.beforeEach(async ({ page }) => {
    currentPage = page;

    await page.coverage.startJSCoverage();
    await page.goto(url);
});

test.afterEach(async () => {
    const coverage = await currentPage?.coverage.stopJSCoverage();
    if (coverage) {
        for (const entry of coverage) {
            const converter = v8toIstanbul('', 0, { source: entry.source });
            try {
                await converter.load();
                converter.applyCoverage(entry.functions);
                const coverageData = converter.toIstanbul();


                // write the coverage data to a json file
                const { writeFile, mkdir } = await import("fs/promises");

                // make coverage folder if it doesn't exist
                await mkdir('coverage', { recursive: true })

                await writeFile(`coverage/coverage-${entry.url.split('/').pop()}.json`, JSON.stringify(coverageData, null, 2));

            }
            catch (err) {

            }
        }
    }
})


// only run this test once
test('Ensure demo app can be packaged for Windows', async ({ page }) => {
    test.slow();

    const demoButton = page.locator('id=demo-action');

    // click demo button to start new test
    await demoButton.click();

    // wait for network to be done
    await page.waitForLoadState('networkidle');

    // our url should contain /reportcard
    await expect(page.url()).toContain('/reportcard');

    // wait for tests to end
    await page.waitForLoadState('networkidle');

    const packageButton = page.locator('id=pfs');

    // click package button
    await packageButton.click();

    const windowsPackageButton = page.locator('id=windows-package-button');

    // click windows package button
    await windowsPackageButton.click();

    // fill out form
    await page.fill('id=package-id-input', 'com.webboard.pwa');

    await page.fill('id=publisher-display-name-input', 'Contoso Inc.');

    await page.fill('id=publisher-id-input', 'CN=asdfasdfasdflkjlkjhlkjh');

    const generateButton = page.locator('id=generate-submit');
    // await generateButton.click();

    await expect(generateButton).toBeVisible();

    // wait on request to https://pwabuilder-winserver.centralus.cloudapp.azure.com/msix/generatezip to finish
    const pageRequest = page.waitForRequest('https://pwabuilder-winserver.centralus.cloudapp.azure.com/msix/generatezip');
    await generateButton.click();
    const request = await pageRequest;

    // wait for response to https://pwabuilder-winserver.centralus.cloudapp.azure.com/msix/generatezip to finish

    const response = await request.response();

    if (response) {
        expect(response.status()).toBe(200);
    }
    else {
        throw new Error('Response was undefined');
    }
})

test('Ensure demo app can be packaged for Android', async ({ page }) => {
    test.slow();
    test.setTimeout(120000)

    const demoButton = page.locator('id=demo-action');

    // click demo button to start new test
    await demoButton.click();

    // wait for network to be done
    await page.waitForLoadState('networkidle');

    // our url should contain /reportcard
    await expect(page.url()).toContain('/reportcard');

    // wait for tests to end
    await page.waitForLoadState('networkidle');

    const packageButton = page.locator('id=pfs');

    // click package button
    await packageButton.click();

    const androidPackageButton = page.locator('id=android-package-button');

    // click windows package button
    await androidPackageButton.click();

    const generateButton = page.locator('id=generate-submit');

    await expect(generateButton).toBeVisible();

    const pageRequest = page.waitForRequest('https://pwabuilder-cloudapk.azurewebsites.net/generateAppPackage');
    await generateButton.click();
    const request = await pageRequest;

    const response = await request.response();

    if (response) {
        expect(response.status()).toBe(200);
    }
    else {
        throw new Error('Response was undefined');
    }
})