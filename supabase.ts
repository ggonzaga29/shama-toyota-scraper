import { createClient } from "@supabase/supabase-js";
import { VehicleMetadataWithVariants } from "./types";
import fs from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;



const uploadImages = async (vehicleMetadata: VehicleMetadataWithVariants) => {
  console.log(SUPABASE_ANON_KEY, SUPABASE_URL)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const formattedName = vehicleMetadata.name?.replace(/\s/g, "-").toLowerCase();

  vehicleMetadata.images?.forEach(async (image) => {
    const filename = `${formattedName}_${image.variantId}_${image.alt?.replace(
      /\s/g,
      ""
    )}.png`.replace(/[<>:"/\\|?*\x00-\x1F]/g, "");
    const path = `resources/images/${filename}`;

    const { data, error } = await supabase.storage
      .from("cars")
      .upload(filename, fs.readFileSync(path), {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
    } else {
      console.log("Uploaded image:", data.path);
    }
  });
};

async function main() {
  const vehicleMetadataWithVariants = JSON.parse(
    fs.readFileSync("resources/vehicles.json", "utf-8")
  ) as VehicleMetadataWithVariants[];

  for (const vehicleMetadata of vehicleMetadataWithVariants) {
    await uploadImages(vehicleMetadata);
  }
}

main();