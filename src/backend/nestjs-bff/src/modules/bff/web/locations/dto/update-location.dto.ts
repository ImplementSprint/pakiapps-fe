import { IsString, IsNumber, IsOptional, IsUrl, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() pricePerHour?: number;
  @IsOptional() @Type(() => Object) operatingHours?: { open: string; close: string };
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsUrl() imageUrl?: string;
}
