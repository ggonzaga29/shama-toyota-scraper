export type VehicleLink = {
  url: string;
  metadataUrl: string;
  name: string;
};

export type VehicleVariantMetadata = {
  id: number | undefined; // This is the variantId
  code: string | undefined;
  vehicleId: number | undefined;
  name: string | undefined;
  transmission: string | undefined;
  fuelType: string | undefined;
  seatingCapacity: number | undefined;
  model: string | undefined;
  type: string | undefined;
  displacement: string | undefined;
  fuelCapacity: string | undefined;
  powerTransmission: string | undefined;
  tires: string | undefined;
  wheels: string | undefined;
  frontRearBrake: string | undefined;
};

export type VehicleMetadataWithVariants = {
  name?: string;
  url?: string;
  metadataUrl?: string;
  images?: {
    variantId: number | undefined;
    url: string | undefined;
    alt: string | undefined;
  }[];
  variants?: VehicleVariantMetadata[];
};
