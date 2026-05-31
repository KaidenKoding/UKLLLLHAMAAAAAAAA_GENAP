// src/transaction/transaction.service.ts
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
    constructor(private prisma: PrismaService) { }

    // PEMBELI
    async createOrder(userId: number, dto: CreateTransactionDto) {
        const menuIds = dto.items.map((item) => item.menuId);
        const menus = await this.prisma.menu.findMany({
            where: { id: { in: menuIds } },
        });

        if (menus.length !== menuIds.length) {
            const foundIds = menus.map((m) => m.id);
            const notFoundIds = menuIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(
                `Menu dengan ID [${notFoundIds.join(', ')}] tidak ditemukan`,
            );
        }

        const menuMap = new Map(menus.map((m) => [m.id, m]));

        // CEK STOK                     
        for (const item of dto.items) {
            const menu = menuMap.get(item.menuId);

            if (!menu) {
                throw new NotFoundException(`Menu dengan ID ${item.menuId} tidak ditemukan`);
            }

            if (menu.stock < item.quantity) {
                throw new BadRequestException(
                    `Stok "${menu.name}" tidak cukup. ` +
                    `Tersedia: ${menu.stock}, Diminta: ${item.quantity}`,
                );
            }

            if (menu.stock === 0) {
                throw new BadRequestException(`Menu "${menu.name}" sedang habis`);
            }
        }

        // HITUNG TOTAL HARGA                             
        const totalPrice = dto.items.reduce((total, item) => {
            const menu = menuMap.get(item.menuId)!;
            return total + menu.price * item.quantity;
        }, 0);

        // VALIDASI SALDO PEMBELI             
        const buyer = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!buyer) {
            throw new NotFoundException(`User dengan ID ${userId} tidak ditemukan`);
        }

        if (buyer.balance < totalPrice) {
            throw new BadRequestException(
                `Saldo tidak cukup. ` +
                `Saldo kamu: Rp${buyer.balance.toLocaleString('id-ID')}, ` +
                `Total belanja: Rp${totalPrice.toLocaleString('id-ID')}`,
            );
        }

        
        const order = await this.prisma.$transaction(async (tx) => {
            for (const item of dto.items) {
                await tx.menu.update({
                    where: { id: item.menuId },
                    data: {
                        stock: {
                            decrement: item.quantity, 
                        },
                    },
                });
            }

            await tx.user.update({
                where: { id: userId },
                data: {
                    balance: {
                        decrement: totalPrice, 
                    },
                },
            });

            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    orderItems: {
                        create: dto.items.map((item) => ({
                            menuId: item.menuId,
                            quantity: item.quantity,
                            price: menuMap.get(item.menuId)!.price, 
                        })),
                    },
                },
                include: {
                    user: { select: { id: true, name: true } },
                    orderItems: {
                        include: {
                            menu: { select: { name: true, price: true } },
                        },
                    },
                },
            });

            return newOrder;
        });
        
        return this.formatNota(order);
    }

    // Akses: KASIR
    async getAllOrders() {
        const orders = await this.prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                orderItems: {
                    include: {
                        menu: { select: { name: true } },
                    },
                },
            },
        });

        return orders.map((order) => ({
            orderId: order.id,
            tanggal: order.createdAt,
            pembeli: order.user,
            items: order.orderItems.map((oi) => ({
                menu: oi.menu.name,
                quantity: oi.quantity,
                hargaSatuan: `Rp${oi.price.toLocaleString('id-ID')}`,
                subtotal: `Rp${(oi.price * oi.quantity).toLocaleString('id-ID')}`,
            })),
            totalBayar: `Rp${order.totalPrice.toLocaleString('id-ID')}`,
        }));
    }

    // Akses: KASIR
    async getOrderById(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                orderItems: {
                    include: {
                        menu: { select: { name: true } },
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException(`Order dengan ID ${orderId} tidak ditemukan`);
        }

        return this.formatNota(order);
    }

    private formatNota(order: any) {
        return {
            nota: {
                idTransaksi: order.id,
                tanggal: new Date(order.createdAt).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                }),
                namaPembeli: order.user.name,
            },
            // ── Detail Item ──
            items: order.orderItems.map((oi: any) => ({
                menu: oi.menu.name,
                quantity: oi.quantity,
                hargaSatuan: `Rp${oi.price.toLocaleString('id-ID')}`,
                subtotal: `Rp${(oi.price * oi.quantity).toLocaleString('id-ID')}`,
            })),
            
            totalBayar: `Rp${order.totalPrice.toLocaleString('id-ID')}`,
            pesan: 'Terima kasih sudah makan di Mie Gacoan',
        };
    }
}