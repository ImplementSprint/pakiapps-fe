import {
  IsUUID,
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  IsEmail,
  IsOptional,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID() locationId: string;
  @IsUUID() parkingSlotId: string;
  @IsUUID() vehicleId: string;
  @IsDateString() date: string;
  @IsString() timeSlot: string;
  @IsIn(['1-Hour Slot', '2-Hour Slot', 'Day Pass']) type: string;
  @IsNumber() amount: number;
  @IsIn(['gcash', 'maya', 'card', 'cash']) paymentMethod: string;

  // Snapshot fields — stored at booking time
  @IsString() userName: string;
  @IsEmail() userEmail: string;
  @IsString() userPhone: string;
  @IsString() vehicleBrand: string;
  @IsString() vehicleModel: string;
  @IsString() vehiclePlate: string;
  @IsString() vehicleType: string;
  @IsString() vehicleColor: string;
  @IsString() locationName: string;
  @IsString() locationAddress: string;
}
