import { VehicleMetadataWithVariants } from "./types";
import fs from "fs";

const downloadImages = async (vehicleMetadata: VehicleMetadataWithVariants) => {
  console.log("Downloading images for:", vehicleMetadata.url);

  const formattedName = vehicleMetadata.name?.replace(/\s/g, "-").toLowerCase();

  // Downlaod all images
  const promises: Promise<void>[] = [];

  vehicleMetadata.images?.forEach((image) => {
    promises.push(
      new Promise(async (resolve) => {
        const response = await fetch(image.url as string);
        const arrayBuffer = await response.arrayBuffer();
        const filename = `${formattedName}_${
          image.variantId
        }_${image.alt?.replace(/\s/g, "")}.png`.replace(
          /[<>:"/\\|?*\x00-\x1F]/g,
          ""
        );
        fs.writeFileSync(
          `resources/images/${filename}`,
          Buffer.from(arrayBuffer)
        );
        resolve();
      })
    );
  });

  await Promise.all(promises);
  await new Promise((resolve) => setTimeout(resolve, 1500));
};

async function main() {
  const vehicleMetadataWithVariants = JSON.parse(
    fs.readFileSync("resources/vehicles.json", "utf-8")
  ) as VehicleMetadataWithVariants[];

  for (const vehicleMetadata of vehicleMetadataWithVariants) {
    await downloadImages(vehicleMetadata);
  }
}

main();
