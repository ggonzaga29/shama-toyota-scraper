import { createClient } from "@supabase/supabase-js";
import { VehicleMetadataWithVariants } from "./types";
import fs from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const uploadImages = async (vehicleMetadata: VehicleMetadataWithVariants) => {
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

const uploadVariants = async (vehicleMetadata: VehicleMetadataWithVariants) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const formattedName = vehicleMetadata.name?.replace(/\s/g, "-").toLowerCase();

  try {
    const { data: newVariant, error } = await supabase
      .from("vehicle_variants")
      .upsert({
        name: vehicleMetadata.name,
        url: vehicleMetadata.url,
        metadata_url: vehicleMetadata.metadataUrl,
      })
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    console.log("Uploaded vehicle:", vehicleMetadata.name);

    for (const variant of vehicleMetadata.variants!) {
      const { data: newVariantMetadata, error } = await supabase
        .from("vehicle_variant_metadata")
        .upsert({
          vehicle_id: newVariant.id,
          variant_id: variant.id,
          code: variant.code,
          name: variant.name,
          transmission: variant.transmission,
          fuel_type: variant.fuelType,
          seating_capacity: variant.seatingCapacity,
          model: variant.model,
          type: variant.type,
          displacement: variant.displacement,
          fuel_capacity: variant.fuelCapacity,
          power_transmission: variant.powerTransmission,
          tires: variant.tires,
          wheels: variant.wheels,
          front_rear_brake: variant.frontRearBrake,
        })
        .select()
        .maybeSingle();

      const variantImages = vehicleMetadata.images!.filter(
        (image) => image.variantId === variant.id
      );

      if (variantImages) {
        for (const image of variantImages) {
          const filename = `${formattedName}_${
            image.variantId
          }_${image.alt?.replace(/\s/g, "")}.png`.replace(
            /[<>:"/\\|?*\x00-\x1F]/g,
            ""
          );
          const path = `${filename}`;

          const { error } = await supabase
            .from("vehicle_variant_images")
            .upsert({
              vehicle_variant_id: newVariant.id,
              variant_metadata_id: newVariantMetadata.id,
              url: path,
              alt: image.alt,
            });

          if (error) {
            console.error("Error uploading image:", error);
          } else {
            console.log("Uploaded image:", path);
          }
        }
      }

      console.log("Uploaded variant:", variant.name);
      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error uploading vehicle:", error);
  }
};

async function main() {
  const vehicleMetadataWithVariants = JSON.parse(
    fs.readFileSync("resources/vehicles.json", "utf-8")
  ) as VehicleMetadataWithVariants[];

  for (const vehicleMetadata of vehicleMetadataWithVariants) {
    // await uploadImages(vehicleMetadata);
    await uploadVariants(vehicleMetadata);
  }
}

main();
