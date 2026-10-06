const { chromium } = require('playwright-core');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: ['--disable-gpu'],
    });
    const report = { errors: [] };
    const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
    });
    const navigation = { waitUntil: 'domcontentloaded', timeout: 60000 };
    page.on('console', (message) => {
        if (message.type() === 'error') report.errors.push(message.text());
    });
    page.on('pageerror', (error) => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:8099/', navigation);
    await page.waitForTimeout(750);
    report.homeStatus = (
        await page.request.get('http://127.0.0.1:8099/')
    ).status();
    const headerBefore = await page.locator('.site-header').boundingBox();
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(250);
    const headerAfter = await page.locator('.site-header').boundingBox();
    report.stickyHeader =
        Math.abs((headerAfter?.y || 0) - 0) < 2 && headerBefore?.y === 0;
    await page.locator('.featured-facilities').scrollIntoViewIfNeeded();
    const cards = page.locator('.facility-card-featured');
    report.facilityCards = await cards.count();
    const widthsBefore = await cards.evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
    );
    await cards.last().hover();
    await page.waitForTimeout(500);
    const widthsAfter = await cards.evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
    );
    report.facilityAccordion =
        widthsAfter.at(-1) > widthsBefore.at(-1) &&
        widthsAfter.at(-1) > widthsAfter[0];
    report.newsSlides = await page.locator('.news-slide:not(.hidden)').count();
    report.newsGeometry = await page
        .locator('.news-slide:not(.hidden)')
        .evaluateAll((nodes) =>
            nodes.map((node) => ({
                className: node.className,
                top: Math.round(node.getBoundingClientRect().top),
                column: getComputedStyle(node).gridColumn,
                row: getComputedStyle(node).gridRow,
            })),
        );
    report.newsSameRow = await page
        .locator('.news-slide:not(.hidden)')
        .evaluateAll(
            (nodes) =>
                new Set(
                    nodes.map((node) =>
                        Math.round(node.getBoundingClientRect().top),
                    ),
                ).size === 1,
        );
    report.heroArrows = await page
        .locator('.hero-slider-controls > button')
        .count();
    report.newsArrows = await page.locator('.news-controls > button').count();
    report.regionSection = await page.locator('.regional-explore').count();
    report.verticalFacilityTitles = await page
        .locator('.facility-vertical-title')
        .count();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({
        path: 'storage/visual-qa/final/home-latest-1440.png',
        fullPage: true,
    });

    await page.goto('http://127.0.0.1:8099/kabar', navigation);
    await page.waitForTimeout(500);
    report.blogCards = await page.locator('.blog-card').count();
    await page.screenshot({
        path: 'storage/visual-qa/final/blog-1440.png',
        fullPage: true,
    });

    await page.goto('http://127.0.0.1:8099/login', navigation);
    await page.locator('input[type="email"]').fill('admin@ggm.test');
    await page.locator('input[type="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin|dashboard/);
    await page.goto('http://127.0.0.1:8099/admin/content', navigation);
    await page.waitForTimeout(500);
    report.adminPreviews = await page.locator('.admin-row-media > img').count();
    report.facilityEditButtons = await page
        .locator('button[aria-label^="Ubah "]')
        .count();
    await page.getByRole('button', { name: 'Kabar & Artikel' }).first().click();
    await page.getByRole('link', { name: 'Tulis artikel' }).click();
    await page.waitForURL(/\/admin\/blog\/posts\/create/);
    report.articleEditorPage = page.url().endsWith('/admin/blog/posts/create');
    report.ckeditor = await page.locator('.ck-editor').count();
    report.articleModal = await page.getByRole('dialog').count();
    await page.screenshot({
        path: 'storage/visual-qa/final/admin-blog-editor-1440.png',
        fullPage: true,
    });
    report.viewWebsiteLinks = await page
        .getByText('View website', { exact: true })
        .count();

    await page.goto(
        'http://127.0.0.1:8099/facilities/lapangan-serba-guna',
        navigation,
    );
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Lihat semua gambar/ }).click();
    report.galleryModal = await page.getByRole('dialog').isVisible();
    report.galleryImages = await page
        .getByRole('dialog')
        .locator('img')
        .count();

    const mobile = await browser.newPage({
        viewport: { width: 390, height: 844 },
    });
    await mobile.goto('http://127.0.0.1:8099/', navigation);
    await mobile.waitForTimeout(500);
    report.mobileOverflow = await mobile.evaluate(
        () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
    );
    await mobile.screenshot({
        path: 'storage/visual-qa/final/home-latest-390.png',
        fullPage: true,
    });
    report.responsiveOverflow = {};
    for (const width of [375, 430, 768, 1024, 1280]) {
        const responsivePage = await browser.newPage({
            viewport: { width, height: width < 700 ? 844 : 900 },
        });
        await responsivePage.goto('http://127.0.0.1:8099/', navigation);
        await responsivePage.waitForTimeout(350);
        report.responsiveOverflow[width] = await responsivePage.evaluate(
            () =>
                document.documentElement.scrollWidth >
                document.documentElement.clientWidth,
        );
        await responsivePage.screenshot({
            path: `storage/visual-qa/final/home-${width}.png`,
        });
        await responsivePage.close();
    }
    await browser.close();
    fs.writeFileSync(
        'storage/visual-qa/latest-report.json',
        JSON.stringify(report, null, 4),
    );
    console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
