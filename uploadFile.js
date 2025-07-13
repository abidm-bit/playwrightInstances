import { chromium } from 'playwright';
import { expect } from '@playwright/test'; // Corrected import for 'expect'
import { basename } from 'path'; // Required for path manipulation, especially basename

(async () => {
    // Launch a Chromium browser instance
    const browser = await chromium.launch({ headless: false }); // headless: false to see the browser UI
    // Create a new page (tab) in the browser
    const page = await browser.newPage();

    try {
        // Navigate to the target URL
        console.log("Navigating to https://demoqa.com/upload-download");
        await page.goto("https://demoqa.com/upload-download");

        // Define the path to the file to be uploaded
        // This path should be accessible from where the script is run.
        // For a more robust solution in a Node.js environment, consider:
        // const fileToUploadPath = path.join(__dirname, 'path/to/your/dash.jpg');
        const fileToUploadPath = "/Users/dema/PycharmProjects/nagini/resource/dash.jpg";

        // Locate the upload file input element using its CSS selector
        // The selector for the upload button is "#uploadFile"
        const uploadInput = page.locator("#uploadFile");

        // Check if the upload input is visible and enabled before attempting to upload
        await expect(uploadInput).toBeVisible();
        await expect(uploadInput).toBeEnabled();
        console.log("Upload file input found and ready.");

        // Use Playwright's page.waitForEvent('filechooser') to handle the file selection dialog.
        // This approach waits for the file chooser event to be triggered after an action (like a click).
        // It's important to start waiting for the event *before* the action that triggers it.
        const fileChooserPromise = page.waitForEvent('filechooser');

        // Click the upload button to trigger the file selection dialog
        // Note: The demoqa site's upload input is a direct file input, so clicking it directly
        // triggers the file chooser. For buttons that open a file dialog indirectly,
        // you would click that button instead.
        await uploadInput.click();

        // Await the file chooser event to get the fileChooser object
        const fileChooser = await fileChooserPromise;

        // Set the files to upload using the fileChooser object
        // This effectively "selects" the file in the native file dialog.
        await fileChooser.setFiles(fileToUploadPath);
        console.log(`File '${fileToUploadPath}' selected via file chooser.`);

        // Optionally, verify the upload message (if available on the page)
        // The demoqa site shows the uploaded file name after upload.
        const uploadedFilePathElement = page.locator("#uploadedFilePath");
        await expect(uploadedFilePathElement).toBeVisible();
        const uploadedText = await uploadedFilePathElement.innerText();
        console.log(`Uploaded file path displayed on page: ${uploadedText}`);

        // Extract just the file name from the full path for verification
        const uploadedFileName = basename(fileToUploadPath);
        // Assert that the uploaded file name is part of the displayed text
        expect(uploadedText).toContain(uploadedFileName);
        console.log("Verification successful: Uploaded file name matches.");

        // Keep the browser open for a few seconds to observe the result
        console.log("Keeping browser open for 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        // Close the browser
        await browser.close();
        console.log("Browser closed.");
    }
})();
