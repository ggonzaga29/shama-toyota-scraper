import puppeteer from "puppeteer";
import { Page } from "puppeteer";
import {
  VehicleLink,
  VehicleVariantMetadata,
  VehicleMetadataWithVariants,
} from "./types";
import fs from "fs";

const ROOT_URL = "https://www.toyota.com.ph";
const VARIANTS_ROOT_URL = "https://toyota.com.ph/get-variants-by-vehicle-name";

const getVehicleLinks = async (
  page: Page
): Promise<
  {
    url: string | null | undefined;
    metadataUrl: string | null | undefined;
  }[]
> => {
  await page.goto(`${ROOT_URL}/vehicles`);

  const vehicles = await page.evaluate(() => {
    const vehicleDivs =
      document.querySelectorAll<HTMLDivElement>(".vehicle-links");

    return Array.from(vehicleDivs).map((div) => {
      const url = div.querySelector<HTMLAnchorElement>("a")?.href;
      const metadataUrl = div.querySelector<HTMLImageElement>("img")?.alt;
      return { url, metadataUrl };
    });
  });

  return vehicles;
};

const getVehicleMetadata = async (page: Page, vehicleLinks: VehicleLink[]) => {
  const vehicleMetadataWithVariants: VehicleMetadataWithVariants[] = [];

  for (const vehicleLink of vehicleLinks) {
    await page.goto(`${vehicleLink.url}`);
    const images: VehicleMetadataWithVariants["images"] = [];
    let variants: VehicleVariantMetadata[] = [];

    console.log("Fetching images for:", vehicleLink.url);

    const carouselItems = await page.evaluate(() => {
      const carouselItems =
        document.querySelectorAll<HTMLDivElement>(".carousel-item");

      return Array.from(carouselItems).map((item) => {
        const variantId = item.dataset.variantId;
        const url = item.querySelector<HTMLImageElement>(".feat-car-img")?.src;
        const imgAlt =
          item.querySelector<HTMLImageElement>(".feat-car-img")?.alt;
        console.log("Found metadata:", { variantId, url });
        return { variantId: parseInt(variantId || "0"), url, alt: imgAlt };
      });
    });

    images.push(...carouselItems.filter((item) => item.url !== undefined));

    page.on("response", async (response) => {
      const url = response.url();
      if (url === vehicleLink.metadataUrl) {
        try {
          const jsonResponse: any = await response.json();

          const variantsParsed: VehicleVariantMetadata[] = jsonResponse.map(
            (variant: any) => {
              return {
                id: variant.id,
                code: variant.code,
                vehicleId: variant.vehicle_id,
                name: variant.name,
                transmission: variant.transmission,
                fuelType: variant.fuel_type,
                seatingCapacity: variant.seating_capacity,
                model: variant.model,
                type: variant.type,
                displacement: variant.displacement,
                fuelCapacity: variant.fuel_capacity,
                powerTransmission: variant.power_transmission,
                tires: variant.tires,
                wheels: variant.wheels,
                frontRearBrake: variant.front_rear_brake,
              };
            }
          );

          variants = variantsParsed;

          console.log(
            "Successfully fetched metadata:",
            vehicleLink.metadataUrl
          );
        } catch (e) {
          console.error(
            "Failed to parse JSON response:",
            vehicleLink.metadataUrl
          );
        }
      }
    });

    await page.goto(`${vehicleLink.metadataUrl}`);

    await new Promise(function (resolve) {
      setTimeout(resolve, 1500);
    });

    vehicleMetadataWithVariants.push({
      name: vehicleLink.name,
      url: vehicleLink.url,
      metadataUrl: vehicleLink.metadataUrl,
      images,
      variants: variants,
    });
  }

  fs.writeFileSync(
    "resources/vehicles.json",
    JSON.stringify(vehicleMetadataWithVariants, null, 2)
  );
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  // const vehicleLinks = await getVehicleLinks(page);
  // fs.writeFileSync(
  //   "resources/vehicleLinks.json",
  //   JSON.stringify(vehicleLinks, null, 2)
  // );

  const vehicleLinks = JSON.parse(
    fs.readFileSync("resources/vehicleLinks.json", "utf-8")
  ) as VehicleLink[];

  await getVehicleMetadata(page, vehicleLinks);

  await browser.close();
})();
