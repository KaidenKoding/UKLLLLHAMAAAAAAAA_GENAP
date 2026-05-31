// src/transaction/dto/create-transaction.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';

// DTO untuk setiap item yang dipesan
export class OrderItemDto {
  @IsInt({ message: 'menuId harus berupa integer' })
  @IsNotEmpty()
  menuId: number;

  @IsInt({ message: 'quantity harus berupa integer' })
  @Min(1, { message: 'Quantity minimal 1' })
  quantity: number;
}

// DTO untuk keseluruhan request order
export class CreateTransactionDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal pesan 1 item' })
  @ValidateNested({ each: true }) // Validasi setiap item dalam array
  @Type(() => OrderItemDto)       // Transform object biasa ke instance OrderItemDto
  items: OrderItemDto[];
}