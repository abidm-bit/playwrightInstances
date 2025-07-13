// Import the playwright module using ES module syntax
import { chromium } from 'playwright';
// Import the exceljs library for writing XLSX files using ES module syntax
import ExcelJS from 'exceljs';
import path from 'path'; // Node.js built-in module for path manipulation
import fs from 'fs/promises'; // Node.js built-in module for file system operations (promises-based)

/**
 * Runs a Playwright script to scrape port/TCP information from a paginated website.
 * It navigates to the initial URL, scrapes tcp ports, and then clicks the "next" button
 * to navigate through pages, collecting data until no more pages are available.
 * Finally, it prints the collected data to the terminal, saves it to an XLSX file,
 * and then saves it to a CSV file.
 */
async function runPlaywrightScript() {
  let browser; // Declare browser variable outside try-catch for finally block access
  const allScrapedData = []; // Array to store all collected port/TCP information

  try {
    // 1. Launch a Chromium browser instance
    // headless: true runs the browser in the background without a UI
    // headless: false opens a visible browser window for debugging
    browser = await chromium.launch({ headless: true });
    console.log('Browser launched successfully.');

    // 2. Create a new browser context
    const context = await browser.newContext();
    console.log('New browser context created.');

    // 3. Create a new page within the context
    const page = await context.newPage();
    console.log('New page created.');

    // 4. Navigate to the target URL
    const url = 'https://www.adminsub.net/tcp-udp-port-finder/keylogger/';
    await page.goto(url, { waitUntil: 'domcontentloaded' }); // Wait for DOM to be ready
    console.log(`Navigated to: ${url}`);

    let pageNumber = 1;

    // Loop to handle pagination
    while (true) {
      console.log(`\n--- Scraping Page ${pageNumber} ---`);

      // 5. Scrape the desired elements on the current page
      // Select all div elements with the specified class
      const portElements = await page.$$('.bl558_pp.size13');

      if (portElements.length === 0) {
        console.log(`No data found on page ${pageNumber}.`);
        break; // Exit if no data elements are found on a page
      }

    // Extract text content from each element and add to our collection
      for (const element of portElements) {
        const text = await element.textContent();
        // Trim whitespace and then remove "Port: " prefix
        allScrapedData.push(text.replace('Port: ', '').trim());
        console.log(`Scraped: ${text.replace('Port: ', '').trim()}`);
      }

      // 6. Check for the "next" button ('>')
      // We use page.locator and check its visibility
      const nextButton = page.locator('a:text-is(">")').nth(1); // .nth(1) selects the second element (0-indexed)
      const isNextButtonVisible = await nextButton.isVisible();

      if (isNextButtonVisible) {
        console.log('Next button found. Clicking...');
        // Click the button and wait for the navigation to complete
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
          nextButton.click()
        ]);
        pageNumber++;
      } else {
        console.log('Next button not found or not visible. End of pagination.');
        break; // Exit the loop if the next button is not visible
      }
    }

    console.log('\n--- Scraping complete ---');
    console.log('Total items scraped:', allScrapedData.length);
    console.log('All Scraped Data:', allScrapedData);

    // 7. Save the scraped data to an XLSX file
    console.log('\n--- Saving data to XLSX ---');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Scraped Ports');

    // Add a header row
    worksheet.addRow(['Port/TCP Information']);

    // Add the scraped data
    allScrapedData.forEach(data => {
      worksheet.addRow([data]);
    });

    const xlsxFileName = 'scraped_ports.xlsx';
    const xlsxFilePath = path.join(process.cwd(), xlsxFileName); // Saves in the current working directory

    await workbook.xlsx.writeFile(xlsxFilePath);
    console.log(`Data successfully saved to ${xlsxFilePath}`);

    // 8. Save the scraped data to a CSV file
    console.log('\n--- Saving data to CSV ---');
    const csvFileName = 'scraped_ports.csv';
    const csvFilePath = path.join(process.cwd(), csvFileName);

    // Prepare CSV content: header + each data item on a new line
    const csvContent = 'Port/TCP Information\n' + allScrapedData.map(item => `"${item.replace(/"/g, '""')}"`).join('\n');
    // Using fs.promises.writeFile for asynchronous file writing
    await fs.writeFile(csvFilePath, csvContent, 'utf8');
    console.log(`Data successfully saved to ${csvFilePath}`);


  } catch (error) {
    console.error('An error occurred during scraping or saving:', error);
  } finally {
    // 9. Close the browser instance
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
}

// Call the main function to execute the script
runPlaywrightScript();
