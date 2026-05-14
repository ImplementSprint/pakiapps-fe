import { IsString, IsNumber, IsOptional, IsUrl, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocationDto {
  @IsString() name: string;
  @IsString() address: string;
  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsNumber() totalSpots: number;
  @IsNumber() pricePerHour: number;
  @IsOptional() @IsUrl() imageUrl?: string | null;
  @Type(() => OperatingHoursDto) operatingHours: OperatingHoursDto;
  @IsArray() @IsString({ each: true }) amenities: string[];
}

class OperatingHoursDto {
  @IsString() open: string;   // HH:MM
  @IsString() close: string;  // HH:MM
}
