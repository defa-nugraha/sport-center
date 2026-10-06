const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const base = 'http://127.0.0.1:8099';
    const out = 'storage/visual-qa/final';
    fs.mkdirSync(out, { recursive: true });
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: ['--disable-gpu'],
    });
    const checks = [
        ['home', '/', 2235],
        ['facility-detail', '/facilities/lapangan-serba-guna', 1708],
        ['sport-basketball', '/sports/basketball', 1708],
        ['event-basketball', '/events/basketball-championship', 1280],
    ];
    const report = [];
    for (const [name, path, width] of checks) {
        const page = await browser.newPage({
            viewport: { width, height: 900 },
            deviceScaleFactor: 1,
        });
        const errors = [];
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });
        page.on('pageerror', (error) => errors.push(error.message));
        const response = await page.goto(base + path, {
            waitUntil: 'networkidle',
        });
        await page.screenshot({
            path: `${out}/${name}-${width}.png`,
            fullPage: true,
        });
        report.push({
            name,
            path,
            width,
            status: response.status(),
            title: await page.title(),
            errors,
            height: await page.evaluate(
                () => document.documentElement.scrollHeight,
            ),
        });
        await page.close();
    }
    const mobile = await browser.newPage({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
    });
    const mobileErrors = [];
    mobile.on('console', (message) => {
        if (message.type() === 'error') mobileErrors.push(message.text());
    });
    await mobile.goto(base + '/', { waitUntil: 'networkidle' });
    await mobile.screenshot({ path: `${out}/home-390.png`, fullPage: true });
    report.push({
        name: 'home-mobile',
        path: '/',
        width: 390,
        status: 200,
        errors: mobileErrors,
        height: await mobile.evaluate(
            () => document.documentElement.scrollHeight,
        ),
        overflow: await mobile.evaluate(
            () =>
                document.documentElement.scrollWidth >
                document.documentElement.clientWidth,
        ),
    });
    await browser.close();
    fs.writeFileSync(
        'storage/visual-qa/report.json',
        JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
