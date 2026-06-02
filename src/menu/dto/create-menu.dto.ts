// src/menu/dto/create-menu.dto.ts
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama menu tidak boleh kosong' })
  name: string;

  @IsNumber()
  @Min(0, { message: 'Harga tidak boleh negatif' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Stok tidak boleh negatif' })
  stock: number;

  @IsString()
  category: string; 
}