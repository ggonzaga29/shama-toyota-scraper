# Shama Toyota Scraper

The main functionality of this scraper is to fetch and download images of various Toyota vehicles from the website. It fetches the images based on the vehicle metadata, which includes the vehicle name and variant ID. The images are then saved locally in the resources/images directory. Vehicle metadata is also saved in the resources directory

This is not designed to be used in the edge or aws lambda as puppeteer is quite heavy. Instead, this should be run in your local computer since the data rarely changes anyway.

## Usage
Before you install anything, gather the credentials from supabase if you plan to upload it to supabase/storage. 
```bash
npm i # Install packages
npm run get-metadata # Gets the vehicle metadata
npm run transform # Downloads the images the CDN
npm run supabase # Uploads the images to supabase (optional)
```